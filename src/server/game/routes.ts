import { createExpressEndpoints, initServer } from "@ts-rest/express";
import express from "express";
import { gameContract, GameStatus, ListGamesApi } from "../../api/game";
import { assert } from "../../utils/validate";
import { GameDao } from "./dao";

import { Op, WhereOptions } from "@sequelize/core";
import { UserRole } from "../../api/user";
import { EngineDelegator } from "../../engine/framework/engine";
import { peek, remove } from "../../utils/functions";
import { pageCursorToString, parsePageCursor } from "../../utils/page_cursor";
import { LogDao } from "../messages/log_dao";
import { sequelize } from "../sequelize";
import "../session";
import { UserDao } from "../user/dao";
import { assertRole } from "../util/enforce_role";
import { stage, Stage } from "../util/environment";
import { GameHistoryDao } from "./history_dao";
import {
  abandonGame,
  inTheLead,
  performAction,
  remainingPlayers,
  startGame,
} from "./logic";
import { MapRegistry } from "../../maps/registry";
import { ReleaseStage } from "../../engine/game/map_settings";

export const gameApp = express();

const router = initServer().router(gameContract, {
  async list({ query, req }) {
    const defaultQuery: ListGamesApi = { pageSize: 20, order: ["id", "DESC"] };
    const {
      pageSize,
      excludeUserId,
      order,
      userId,
      status,
      pageCursor: pageCursorString,
      ...rest
    } = { ...defaultQuery, ...query };

    const pageCursor = parsePageCursor(pageCursorString);
    let where: WhereOptions<GameDao> = rest;

    if (status != null) {
      if (status.length === 1) {
        where.status = status[0];
      } else if (status.length > 1) {
        where.status = { [Op.in]: status };
      }
    }
    if (userId != null) {
      where.playerIds = { [Op.contains]: [userId] };
    }
    if (excludeUserId != null) {
      where.playerIds = {
        ...where.playerIds,
        [Op.not]: {
          [Op.contains]: [excludeUserId],
        },
      };
    }
    if (pageCursor != null) {
      where.id = { [Op.notIn]: pageCursor };
    }

    // Add a condition so that only games which are not marked as unlisted or which the user is a part of will be included
    if (req.session.userId) {
      where = {
        [Op.and]: [
          {
            [Op.or]: [
              { playerIds: { [Op.contains]: [req.session.userId] } },
              { unlisted: false },
            ],
          },
          where,
        ],
      };
    } else {
      where.unlisted = false;
    }

    const games = await GameDao.findAll({
      attributes: [
        "id",
        "gameKey",
        "name",
        "gameData",
        "config",
        "variant",
        "status",
        "activePlayerId",
        "playerIds",
        "turnDuration",
        "unlisted",
        "autoStart",
      ],
      where,
      limit: pageSize! + 1,
      order: order != null ? [order] : [["id", "DESC"]],
    });
    if (games.length > pageSize!) {
      const gamesApi = games.slice(0, pageSize).map((g) => g.toLiteApi());
      const nextPageCursor = (pageCursor ?? []).concat(
        gamesApi.map(({ id }) => id),
      );
      return {
        status: 200,
        body: {
          nextPageCursor: pageCursorToString(nextPageCursor),
          games: gamesApi,
        },
      };
    } else {
      return { status: 200, body: { games: games.map((g) => g.toLiteApi()) } };
    }
  },

  async get({ params }) {
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    return { status: 200, body: { game: game.toApi() } };
  },

  async create({ body, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });
    const user = await assertRole(req);
    const isAdmin = user.role === UserRole.enum.ADMIN;

    const map = MapRegistry.singleton.get(body.gameKey);
    assert(map != null, { invalidInput: true });
    assert(
      stage() === Stage.enum.development ||
        map.stage !== ReleaseStage.DEVELOPMENT ||
        isAdmin ||
        (map.developmentAllowlist !== undefined &&
          map.developmentAllowlist.indexOf(userId) !== -1),
      { permissionDenied: true },
    );
    assert(map.stage !== ReleaseStage.DEVELOPMENT || body.unlisted, { invalidInput: "Development map games must be unlisted." });

    const playerIds = [userId];
    if (body.artificialStart) {
      assert(stage() === Stage.enum.development);
      const users = await UserDao.findAll({
        where: { id: { [Op.ne]: userId }, role: UserRole.enum.USER },
        limit: body.minPlayers - 1,
      });
      playerIds.push(...users.map(({ id }) => id));
    }
    const game = await GameDao.create({
      version: 1,
      gameKey: body.gameKey,
      name: body.name,
      status: GameStatus.enum.LOBBY,
      turnDuration: body.turnDuration,
      concedingPlayers: [],
      playerIds,
      variant: body.variant,
      config: {
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
      },
      unlisted: body.unlisted,
      autoStart: body.autoStart,
    });
    return { status: 201, body: { game: game.toApi() } };
  },

  async deleteGame({ params, req }) {
    const user = await assertRole(req);

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);

    const isAdmin = user.role === UserRole.enum.ADMIN;
    if (!isAdmin) {
      assert(
        game.status === GameStatus.enum.LOBBY || game.playerIds.length === 1,
        {
          invalidInput: "cannot delete started game unless it's a solo",
        },
      );
      assert(game.playerIds[0] === user.id, { permissionDenied: true });
    }

    await sequelize.transaction(() =>
      Promise.all([
        game.destroy(),
        LogDao.destroy({ where: { gameId: game.id } }),
        GameHistoryDao.destroy({ where: { gameId: game.id } }),
      ]),
    );

    return { status: 200, body: { success: true } };
  },

  async join({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, "cannot join started game");
    assert(!game.playerIds.includes(userId), { invalidInput: true });
    assert(game.playerIds.length < game.toLiteApi().config.maxPlayers, {
      invalidInput: "game full",
    });

    game.playerIds = [...game.playerIds, userId];
    const newGame = await game.save();
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async leave({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, "cannot leave started game");
    const index = game.playerIds.indexOf(userId);
    assert(index >= 0, { invalidInput: "cannot leave game you are not in" });
    // Figure out what to do if the owner wants to leave
    assert(index > 0, { invalidInput: "the owner cannot leave the game" });

    game.playerIds = game.playerIds
      .slice(0, index)
      .concat(game.playerIds.slice(index + 1));
    const newGame = await game.save();
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async start({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const seed = stage() !== Stage.enum.production ? req.body.seed : undefined;

    const game = await startGame(params.gameId, userId, seed);
    return { status: 200, body: { game } };
  },

  async setGameData({ req, params, body }) {
    await assertRole(req, UserRole.enum.ADMIN);
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    game.gameData = body.gameData;
    await game.save();
    return { status: 200, body: { game: game.toApi() } };
  },

  async performAction({ req, params, body }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });
    const game = await performAction(
      params.gameId,
      userId,
      body.actionName,
      body.actionData,
      body.confirmed,
    );

    return {
      status: 200,
      body: { game: game.toApi(), auto: game.getAutoActionForUser(userId) },
    };
  },

  async undoAction({
    req,
    params: { gameId },
    body: { backToVersion, adminOverride },
  }) {
    if (adminOverride) {
      await assertRole(req, UserRole.enum.ADMIN);
    }
    return await sequelize.transaction(async (transaction) => {
      const gameHistory = await GameHistoryDao.findOne({
        where: { gameId, previousGameVersion: backToVersion },
        transaction,
      });
      const game = await GameDao.findByPk(gameId, { transaction });
      assert(game != null);
      assert(gameHistory != null);
      assert(
        game.status === GameStatus.Enum.ACTIVE,
        "cannot undo an ended game",
      );
      assert(
        game.version === gameHistory.previousGameVersion + 1,
        "can only undo one step",
      );
      if (!adminOverride) {
        assert(gameHistory.reversible, {
          invalidInput: "cannot undo irreversible action",
        });
        assert(gameHistory.userId === req.session.userId, {
          permissionDenied: true,
        });
      }

      game.version = backToVersion;
      game.gameData = gameHistory.previousGameData;
      game.activePlayerId = gameHistory.userId ?? null;

      const versionBefore = await GameHistoryDao.findOne({
        where: { gameId, previousGameVersion: backToVersion - 1 },
        transaction,
      });
      game.undoPlayerId =
        versionBefore != null && versionBefore.reversible
          ? versionBefore.userId
          : null;
      const newGame = await game.save({ transaction });
      await GameHistoryDao.destroy({
        where: { gameId, previousGameVersion: { [Op.gte]: backToVersion } },
        transaction,
      });
      await LogDao.destroyLogsBackTo(gameId, backToVersion, transaction);

      return { status: 200, body: { game: newGame.toApi() } };
    });
  },

  async retryLast({ req, body, params }) {
    await assertRole(req, UserRole.enum.ADMIN);
    const limit = body.steps;
    const previousActions = await GameHistoryDao.findAll({
      where: { gameId: params.gameId },
      limit,
      order: [["id", "DESC"]],
    });
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    assert(previousActions.length == body.steps, {
      invalidInput: "There are not that many steps to retry",
    });

    const users = await Promise.all(
      game.playerIds.map((id) => UserDao.getUser(id)),
    );

    let previousAction: GameHistoryDao | undefined;
    let currentGameData: string;
    let currentGameVersion: number;
    let finalActivePlayerId: number | undefined;
    let finalUndoPlayerId: number | undefined;
    const allLogs: LogDao[] = [];
    const firstAction = peek(previousActions);

    const newHistory: GameHistoryDao[] = [];

    if (!firstAction.isActionHistory()) {
      const { gameData, logs, activePlayerId, seed } =
        EngineDelegator.singleton.start({
          players: users.map((user) => ({
            playerId: user!.id,
            preferredColors: user!.preferredColors,
          })),
          game: { ...game.toLimitedGame(), gameData: undefined },
          seed: firstAction.seed!,
        });
      currentGameData = gameData;
      currentGameVersion = 1;
      finalActivePlayerId = activePlayerId;

      newHistory.push(
        GameHistoryDao.build({
          previousGameVersion: currentGameVersion - 1,
          reversible: false,
          seed,
          gameId: game.id,
        }),
      );

      allLogs.push(
        ...logs.map((message) =>
          LogDao.build({
            gameId: game.id,
            message,
            previousGameVersion: 0,
          }),
        ),
      );

      previousActions.pop();
    } else {
      currentGameData = firstAction.previousGameData;
      currentGameVersion = firstAction.previousGameVersion;
    }
    const firstGameVersion = currentGameVersion;
    let finalHasEnded: boolean | undefined;
    while ((previousAction = previousActions.pop()) != null) {
      assert(previousAction.isActionHistory());
      const { gameData, logs, activePlayerId, hasEnded, reversible, seed } =
        EngineDelegator.singleton.processAction(game.gameKey, {
          game: game.toLimitedGame(),
          actionName: previousAction.actionName,
          actionData: JSON.parse(previousAction.actionData),
          seed: previousAction.seed ?? undefined,
        });

      newHistory.push(
        GameHistoryDao.build({
          previousGameVersion: currentGameVersion,
          patch: "",
          previousGameData: currentGameData,
          actionName: previousAction.actionName,
          actionData: previousAction.actionData,
          reversible,
          seed,
          gameId: game.id,
          userId: previousAction.userId,
        }),
      );

      allLogs.push(
        ...logs.map((message) =>
          LogDao.build({
            gameId: game.id,
            message,
            previousGameVersion: currentGameVersion,
          }),
        ),
      );

      currentGameVersion++;
      currentGameData = gameData;
      finalHasEnded = hasEnded;
      finalActivePlayerId = activePlayerId;
      finalUndoPlayerId = reversible ? previousAction.userId : undefined;
    }

    game.version = currentGameVersion;
    game.gameData = currentGameData;
    game.activePlayerId = finalActivePlayerId ?? null;
    game.status = finalHasEnded
      ? GameStatus.enum.ENDED
      : GameStatus.enum.ACTIVE;
    game.undoPlayerId = finalUndoPlayerId ?? null;
    await sequelize.transaction(async (transaction) => {
      await Promise.all([
        game.save({ transaction }),
        LogDao.destroyLogsBackTo(game.id, firstGameVersion, transaction),
        GameHistoryDao.destroy({
          where: {
            gameId: game.id,
            previousGameVersion: { [Op.gte]: firstGameVersion },
          },
          transaction,
        }),
        ...newHistory.map((history) => history.save({ transaction })),
        ...allLogs.map((log) => log.save({ transaction })),
      ]);
    });

    return { status: 200, body: { game: game.toApi() } };
  },
  async concede({ req, params, body }) {
    await assertRole(req);
    const userId = req.session.userId;
    assert(userId != null);
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    assert(game.playerIds.includes(userId), { permissionDenied: true });
    assert(game.status === GameStatus.enum.ACTIVE, {
      invalidInput: "Can only concede an active game",
    });
    const hasConceded = game.concedingPlayers.includes(userId);
    if (body.concede) {
      if (!hasConceded) {
        game.concedingPlayers = game.concedingPlayers.concat([userId]);
      }
    } else {
      if (hasConceded) {
        game.concedingPlayers = remove(game.concedingPlayers, userId);
      }
    }
    assert(game.concedingPlayers.length <= game.playerIds.length);
    const remaining = remainingPlayers(game).filter(
      (playerId) => !game.concedingPlayers.includes(playerId),
    );
    const noneRemaining = remaining.length === 0;
    const leadPlayer = inTheLead(game);
    const onlyLeadPlayerRemaining =
      remaining.length === 1 &&
      leadPlayer.length === 1 &&
      leadPlayer[0] === remaining[0];
    if (noneRemaining || onlyLeadPlayerRemaining) {
      game.status = GameStatus.enum.ENDED;
      game.activePlayerId = null;
      game.undoPlayerId = null;
    }
    await game.save();
    return { status: 200, body: { game: game.toApi() } };
  },
  async abandon({ req, params }) {
    await assertRole(req);
    const userId = req.session.userId;
    assert(userId != null);
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    assert(game.playerIds.includes(userId), { permissionDenied: true });
    await abandonGame(game, userId, /* kicked= */ false);
    return { status: 200, body: { game: game.toApi() } };
  },
  async kick({ req, params }) {
    await assertRole(req);
    const userId = req.session.userId;
    assert(userId != null);
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    assert(game.playerIds.includes(userId), { permissionDenied: true });
    assert(game.status === GameStatus.enum.ACTIVE, {
      invalidInput: "Can only kick an active game",
    });
    assert(game.activePlayerId != null);
    assert(
      game.turnStartTime != null &&
        game.turnStartTime.getTime() + game.turnDuration < Date.now(),
      { invalidInput: "cannot kick until kick duration has passed" },
    );
    await abandonGame(game, game.activePlayerId, /* kicked= */ true);
    return { status: 200, body: { game: game.toApi() } };
  },
});

createExpressEndpoints(gameContract, router, gameApp);
