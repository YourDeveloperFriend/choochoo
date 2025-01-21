import { InstanceUpdateOptions } from "@sequelize/core";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server, ServerOptions, Socket } from "socket.io";
import { GameApi } from "../api/game";
import { ClientToServerEvents, ServerToClientEvents } from "../api/socket";
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

const HOME_ROOM = 'HOME_ROOM';

function roomName(gameId?: number | null) {
  return gameId == undefined ? HOME_ROOM : 'gameId-' + gameId;
}

export function emitGameUpdate(oldGame: GameApi | undefined, game: GameDao): void {
  const gameApi = game.toApi();
  const gameLiteApi = game.toLiteApi();
  if (oldGame == null || !deepEquals(oldGame, gameApi)) {
    io.to(roomName(game.id)).emit('gameUpdate', gameApi);
  }
  io.to(roomName()).emit('gameUpdateLite', gameLiteApi);
}

export function emitGameDestroy(gameId: number): void {
  io.to(roomName()).emit('gameDestroy', gameId);
}

export function emitLogCreate(log: LogDao): void {
  io.to(roomName(log.gameId)).emit('newLog', log.toApi());
}

export function emitLogDestroy(log: LogDao): void {
  io.to(roomName(log.gameId)).emit('destroyLog', log.id);
}

function bindSocket(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const rooms = new Map<string, number>();

  function joinRoom(gameId?: number) {
    const name = roomName(gameId);
    if (!rooms.has(name)) {
      rooms.set(name, 1);
      socket.join(name);
    } else {
      rooms.set(name, rooms.get(name)! + 1);
    }
  }

  function leaveRoom(gameId?: number) {
    const name = roomName(gameId);
    if (!rooms.has(name)) {
      return;
    } else if (rooms.get(name) === 1) {
      rooms.delete(name);
      socket.leave(name);
    } else {
      rooms.set(name, rooms.get(name)! - 1);
    }
  }

  socket.on('joinHomeRoom', joinRoom);
  socket.on('leaveHomeRoom', leaveRoom);
  socket.on('joinGameRoom', joinRoom);
  socket.on('leaveGameRoom', leaveRoom);
}

Lifecycle.singleton.onStart(() => {
  io.on('connection', bindSocket);

  const previous = new WeakMap<GameDao, GameApi | undefined>();

  GameDao.hooks.addListener('beforeSave', (game: GameDao, options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      if (game.isNewRecord) {
        previous.set(game, undefined);
      } else {
        previous.set(game, toApi({ ...game.dataValues, ...game.previous() }));
      }
    });
  });

  GameDao.hooks.addListener('afterSave', (game: GameDao, options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      emitGameUpdate(previous.get(game), game);
    });
  });

  GameDao.hooks.addListener('afterDestroy', (game: GameDao, options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      emitGameDestroy(game.id);
    });
  });

  LogDao.hooks.addListener('afterDestroy', (log: LogDao, options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      emitLogDestroy(log);
    });
  });

  LogDao.hooks.addListener('afterBulkCreate', (logs: LogDao[], options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      for (const log of logs) {
        emitLogCreate(log);
      }
    });
  });

  LogDao.hooks.addListener('afterCreate', (log: LogDao, options: InstanceUpdateOptions) => {
    afterTransaction(options, () => {
      emitLogCreate(log);
    });
  });
});