import { InstanceUpdateOptions } from "@sequelize/core";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server, ServerOptions, Socket } from "socket.io";
import { GameApi } from "../api/game";
import {
  ClientToServerEvents,
  RoomSyncProps,
  ServerToClientEvents,
} from "../api/socket";
import { deepEquals } from "../utils/deep_equals";
import { afterTransaction } from "../utils/transaction";
import { GameDao, toApi } from "./game/dao";
import { LogDao } from "./messages/log_dao";
import { redisClient, subClient } from "./redis";
import { environment } from "./util/environment";
import { Lifecycle } from "./util/lifecycle";

const args: Partial<ServerOptions> = {
  adapter: createAdapter(redisClient, subClient),
};

if (environment.clientOrigin != null) {
  args.cors = {
    origin: environment.clientOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  };
}

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(args);

const HOME_ROOM = "HOME_ROOM";

function roomName(gameId?: number | null) {
  return gameId == undefined ? HOME_ROOM : "gameId-" + gameId;
}

function emitGameUpdate(oldGame: GameApi | undefined, game: GameDao): void {
  const gameApi = game.toApi();
  const gameLiteApi = game.toLiteApi();
  if (oldGame == null || !deepEquals(oldGame, gameApi)) {
    io.to(roomName(game.id)).emit("gameUpdate", gameApi);
  }
  io.to(roomName()).emit("gameUpdateLite", gameLiteApi);
}

function emitGameDestroy(gameId: number): void {
  io.to(roomName()).emit("gameDestroy", gameId);
}

function emitLogCreate(log: LogDao): void {
  io.to(roomName(log.gameId)).emit("newLog", log.toApi());
}

function emitLogDestroy(log: LogDao): void {
  io.to(roomName(log.gameId)).emit("destroyLog", log.id);
}

function bindSocket(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
  function syncRooms(props: RoomSyncProps) {
    const newRooms = new Set(props.games.map(roomName));
    if (props.connectToHome) {
      newRooms.add(roomName());
    }

    for (const room of newRooms) {
      if (socket.rooms.has(room)) continue;
      socket.join(room);
    }
    for (const room of socket.rooms) {
      if (newRooms.has(room)) continue;
      socket.leave(room);
    }
  }

  socket.on("roomSync", syncRooms);
}

Lifecycle.singleton.onStart(() => {
  io.on("connection", bindSocket);

  GameDao.hooks.addListener(
    "beforeSave",
    (game: GameDao, options: InstanceUpdateOptions) => {
      const oldGame = game.isNewRecord
        ? undefined
        : toApi({ ...game.dataValues, ...game.previous() });
      afterTransaction(options, () => {
        emitGameUpdate(oldGame, game);
      });
    },
  );

  GameDao.hooks.addListener(
    "afterDestroy",
    (game: GameDao, options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        emitGameDestroy(game.id);
      });
    },
  );

  LogDao.hooks.addListener(
    "afterDestroy",
    (log: LogDao, options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        emitLogDestroy(log);
      });
    },
  );

  LogDao.hooks.addListener(
    "afterBulkCreate",
    (logs: LogDao[], options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        for (const log of logs) {
          emitLogCreate(log);
        }
      });
    },
  );

  LogDao.hooks.addListener(
    "afterCreate",
    (log: LogDao, options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        emitLogCreate(log);
      });
    },
  );
});
