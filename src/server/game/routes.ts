
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import { gameContract, GameStatus, ListGamesApi } from '../../api/game';
import { assert } from '../../utils/validate';
import { GameDao } from './dao';

import { Op, WhereOptions } from '@sequelize/core';
import { UserRole } from '../../api/user';
import { EngineDelegator } from '../../engine/framework/engine';
import { peek } from '../../utils/functions';
import { LogDao } from '../messages/log_dao';
import { sequelize } from '../sequelize';
import '../session';
import { UserDao } from '../user/dao';
import { assertRole } from '../util/enforce_role';
import { environment, Stage } from '../util/environment';
import { notifyTurn } from '../util/turn_notification';
import { GameHistoryDao } from './history_dao';

export const gameApp = express();

const s = initServer();

const router = initServer().router(gameContract, {
  async list({ query }) {
    const defaultQuery: ListGamesApi = { pageSize: 20, order: ['id', 'DESC'] };
    const { pageSize, excludeUserId, order, userId, status, pageCursor, ...rest } = { ...defaultQuery, ...query };
    const where: WhereOptions<GameDao> = rest;
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
    const games = await GameDao.findAll({
      attributes: ['id', 'gameKey', 'name', 'gameData', 'config', 'status', 'activePlayerId', 'playerIds'],
      where,
      limit: pageSize! + 1,
      order: order != null ? [order] : [['id', 'DESC']],
    });
    if (games.length > pageSize!) {
      const gamesApi = games.slice(0, pageSize).map((g) => g.toLiteApi());
      const nextPageCursor = (pageCursor ?? []).concat(gamesApi.map(({ id }) => id));
      return { status: 200, body: { nextPageCursor, games: gamesApi } };
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
    const playerIds = [userId];
    if (body.artificialStart) {
      assert(environment.stage === Stage.enum.development);
      const users = await UserDao.findAll({ where: { id: { [Op.ne]: userId }, role: UserRole.enum.USER }, limit: body.minPlayers - 1 });
      playerIds.push(...users.map(({ id }) => id));
    }
    const game = await GameDao.create({
      version: 1,
      gameKey: body.gameKey,
      name: body.name,
      status: GameStatus.enum.LOBBY,
      playerIds,
      config: {
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
      },
    });
    return { status: 201, body: { game: game.toApi() } };
  },

  async join({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, 'cannot join started game');
    assert(!game.playerIds.includes(userId), { invalidInput: true });
    assert(game.playerIds.length < game.toLiteApi().config.maxPlayers, { invalidInput: 'game full' });

    const originalGame = game.toApi();
    game.playerIds = [...game.playerIds, userId];
    const newGame = await game.save();
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async leave({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, 'cannot leave started game');
    const index = game.playerIds.indexOf(userId);
    assert(index >= 0, { invalidInput: 'cannot leave game you are not in' });
    // Figure out what to do if the owner wants to leave
    assert(index > 0, { invalidInput: 'the owner cannot leave the game' });

    const originalGame = game.toApi();
    game.playerIds = game.playerIds.slice(0, index).concat(game.playerIds.slice(index + 1));
    const newGame = await game.save();
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async start({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameDao.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, { invalidInput: 'cannot start a game that has already been started' });
    assert(game.playerIds[0] === userId, { invalidInput: 'only the owner can start the game' });
    assert(game.playerIds.length >= game.toLiteApi().config.minPlayers, 'not enough players to start the game');

    const originalGame = game.toApi();
    const { gameData, logs, activePlayerId } = EngineDelegator.singleton.start(game.playerIds, { mapKey: game.gameKey });

    game.gameData = gameData;
    game.status = GameStatus.enum.ACTIVE;
    game.activePlayerId = activePlayerId ?? null;
    const [newGame] = await sequelize.transaction((transaction) => Promise.all([
      game.save({ transaction }),
      LogDao.createForGame(game.id, game.version - 1, logs, transaction),
    ]));
    return { status: 200, body: { game: newGame.toApi() } };
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
    return await sequelize.transaction(async (transaction) => {
      const userId = req.session.userId;
      assert(userId != null, { permissionDenied: true });

      const game = await GameDao.findByPk(params.gameId, { transaction });
      assert(game != null);
      assert(game.status === GameStatus.enum.ACTIVE, 'cannot perform an action unless the game is live');
      assert(game.gameData != null);
      assert(game.activePlayerId === req.session.userId, { permissionDenied: true });

      const originalGame = game.toApi();

      const { gameData, logs, activePlayerId, hasEnded, reversible } =
        EngineDelegator.singleton.processAction(game.gameKey, game.gameData, body.actionName, body.actionData);

      const gameHistory = GameHistoryDao.build({
        previousGameVersion: game.version,
        patch: '',
        previousGameData: game.gameData,
        actionName: body.actionName,
        actionData: JSON.stringify(body.actionData),
        reversible,
        gameId: game.id,
        userId,
      });

      const playerChanged = game.activePlayerId !== activePlayerId;

      game.version = game.version + 1;
      game.gameData = gameData;
      game.activePlayerId = activePlayerId ?? null;
      game.status = hasEnded ? GameStatus.enum.ENDED : GameStatus.enum.ACTIVE;
      game.undoPlayerId = reversible ? userId : null;

      const [newGame, newGameHistory] = await Promise.all([
        game.save({ transaction }),
        gameHistory.save({ transaction }),
        LogDao.createForGame(game.id, game.version - 1, logs),
      ]);

      console.log(`Game action id=${newGameHistory.id} reversible=${reversible} actionName=${body.actionName}`);

      transaction.afterCommit(() => {
        if (!playerChanged) return;
        notifyTurn(newGame).catch(e => {
          console.log('Failed during processAsync');
          console.error(e);
        });
      });

      return { status: 200, body: { game: newGame.toApi() } };
    });
  },

  async undoAction({ req, params: { gameId }, body: { backToVersion } }) {
    return await sequelize.transaction(async transaction => {
      const gameHistory = await GameHistoryDao.findOne({ where: { gameId, previousGameVersion: backToVersion }, transaction });
      const game = await GameDao.findByPk(gameId, { transaction });
      assert(game != null);
      assert(gameHistory != null);
      assert(gameHistory.reversible, { invalidInput: 'cannot undo irreversible action' });
      assert(game.version === gameHistory.previousGameVersion + 1, 'can only undo one step');
      assert(gameHistory.userId === req.session.userId, { permissionDenied: true });

      const originalGame = game.toApi();

      game.version = backToVersion;
      game.gameData = gameHistory.previousGameData;
      game.activePlayerId = gameHistory.userId ?? null;

      const versionBefore = await GameHistoryDao.findOne({ where: { gameId, previousGameVersion: backToVersion - 1 }, transaction });
      game.undoPlayerId = versionBefore != null && versionBefore.reversible ? versionBefore.userId : null;
      const newGame = await game.save({ transaction });
      await GameHistoryDao.destroy({ where: { gameId, previousGameVersion: { [Op.gte]: backToVersion } }, transaction });
      await LogDao.destroyLogsBackTo(gameId, backToVersion, transaction);

      return { status: 200, body: { game: newGame.toApi() } };
    });
  },

  async retryLast({ req, body, params }) {
    await assertRole(req, UserRole.enum.ADMIN);
    const limit = 'steps' in body ? body.steps : 20;
    const previousActions = await GameHistoryDao.findAll({ where: { gameId: params.gameId }, limit, order: [['id', 'DESC']] });
    const game = await GameDao.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    if ('steps' in body) {
      assert(previousActions.length == body.steps, { invalidInput: 'There are not that many steps to retry' });
    } else {
      assert(previousActions.length < limit, { invalidInput: 'Cannot start over if already twenty steps in' });
    }

    const originalGame = game.toApi();

    let previousAction: GameHistoryDao | undefined;
    let currentGameData: string | undefined;
    let currentGameVersion: number | undefined;
    let finalActivePlayerId: number | undefined;
    let finalUndoPlayerId: number | undefined;
    const allLogs: LogDao[] = [];
    if ('startOver' in body && body.startOver) {
      const { gameData, logs, activePlayerId } = EngineDelegator.singleton.start(game.playerIds, { mapKey: game.gameKey });
      currentGameData = gameData;
      currentGameVersion = 1;
      finalActivePlayerId = activePlayerId;
      allLogs.push(...logs.map((message) => LogDao.build({
        gameId: game.id,
        message,
        previousGameVersion: 0,
      })));
    } else {
      currentGameData = peek(previousActions).previousGameData;
      currentGameVersion = peek(previousActions).previousGameVersion;
    }
    let firstGameVersion = currentGameVersion;
    let finalHasEnded: boolean | undefined;
    const newHistory: GameHistoryDao[] = [];
    while (previousAction = previousActions.pop()) {
      const { gameData, logs, activePlayerId, hasEnded, reversible } =
        EngineDelegator.singleton.processAction(game.gameKey, currentGameData, previousAction.actionName, JSON.parse(previousAction.actionData));

      newHistory.push(GameHistoryDao.build({
        previousGameVersion: currentGameVersion,
        patch: '',
        previousGameData: currentGameData,
        actionName: previousAction.actionName,
        actionData: previousAction.actionData,
        reversible,
        gameId: game.id,
        userId: previousAction.userId,
      }));

      allLogs.push(...logs.map(message => LogDao.build({
        gameId: game.id,
        message,
        previousGameVersion: currentGameVersion,
      })));

      currentGameVersion++;
      currentGameData = gameData;
      finalHasEnded = hasEnded;
      finalActivePlayerId = activePlayerId;
      finalUndoPlayerId = reversible ? previousAction.userId : undefined;
    }

    game.version = currentGameVersion;
    game.gameData = currentGameData;
    game.activePlayerId = finalActivePlayerId ?? null;
    game.status = finalHasEnded ? GameStatus.enum.ENDED : GameStatus.enum.ACTIVE;
    game.undoPlayerId = finalUndoPlayerId ?? null;
    await sequelize.transaction(async (transaction) => {
      await Promise.all([
        game.save({ transaction }),
        LogDao.destroyLogsBackTo(game.id, firstGameVersion, transaction),
        GameHistoryDao.destroy({ where: { gameId: game.id, previousGameVersion: { [Op.gte]: firstGameVersion } }, transaction }),
        ...newHistory.map((history) => history.save({ transaction })),
        ...allLogs.map(log => log.save({ transaction })),
      ]);
    });

    return { status: 200, body: { game: game.toApi() } };
  },
});

createExpressEndpoints(gameContract, router, gameApp);
