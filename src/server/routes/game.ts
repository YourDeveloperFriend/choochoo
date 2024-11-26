
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import { gameContract, GameStatus } from '../../api/game';
import { assert } from '../../utils/validate';
import { GameModel } from '../model/game';

import { Op, WhereOptions } from '@sequelize/core';
import { UserRole } from '../../api/user';
import { Engine } from '../../engine/framework/engine';
import { GameStatus as GameEngineStatus } from '../../engine/game/game';
import { MapRegistry } from '../../maps';
import { peek } from '../../utils/functions';
import { GameHistoryModel } from '../model/history';
import { CreateLogModel, LogModel } from '../model/log';
import { UserModel } from '../model/user';
import { sequelize } from '../sequelize';
import '../session';
import { emitGameUpdate, emitLogsDestroyToRoom, emitLogsReplaceToRoom, emitToRoom } from '../socket';
import { enforceRole } from '../util/enforce_role';
import { environment, Stage } from '../util/environment';

export const gameApp = express();

const s = initServer();

const router = initServer().router(gameContract, {
  async list({ query }) {
    const { limit, order, userId, ...rest } = query;
    const where: WhereOptions<GameModel> = rest;
    if (userId != null) {
      where.playerIds = { [Op.contains]: [userId] };
    }
    const games = await GameModel.findAll({
      attributes: ['id', 'gameKey', 'name', 'status', 'activePlayerId', 'playerIds'],
      where,
      limit: limit ?? 20,
      order: order != null ? [order] : [['id', 'DESC']],
    });
    return { status: 200, body: { games: games.map((g) => g.toLiteApi()) } };
  },

  async get({ params }) {
    const game = await GameModel.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    return { status: 200, body: { game: game.toApi() } };
  },

  async create({ body, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });
    const playerIds = [userId];
    if (body.artificialStart) {
      const users = await UserModel.findAll({ where: { id: { [Op.ne]: userId }, role: UserRole.enum.USER }, limit: 3 });
      playerIds.push(...users.map(({ id }) => id));
    }
    const game = await GameModel.create({
      version: 1,
      gameKey: body.gameKey,
      name: body.name,
      status: GameStatus.enum.LOBBY,
      playerIds,
    });
    emitGameUpdate(undefined, game);
    return { status: 201, body: { game: game.toApi() } };
  },

  async join({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameModel.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, 'cannot join started game');
    assert(!game.playerIds.includes(userId), { invalidInput: true });

    const originalGame = game.toApi();
    game.playerIds = [...game.playerIds, userId];
    const newGame = await game.save();
    emitGameUpdate(originalGame, newGame);
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async leave({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameModel.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, 'cannot leave started game');
    const index = game.playerIds.indexOf(userId);
    assert(index >= 0, { invalidInput: 'cannot leave game you are not in' });
    // Figure out what to do if the owner wants to leave
    assert(index > 0, { invalidInput: 'the owner cannot leave the game' });
    assert(game.playerIds.length < new MapRegistry().get(game.gameKey)!.maxPlayers, 'game full');

    const originalGame = game.toApi();
    game.playerIds = game.playerIds.slice(0, index).concat(game.playerIds.slice(index + 1));
    const newGame = await game.save();
    emitGameUpdate(originalGame, newGame);
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async start({ params, req }) {
    const userId = req.session.userId;
    assert(userId != null, { permissionDenied: true });

    const game = await GameModel.findByPk(params.gameId);
    assert(game != null);
    assert(game.status === GameStatus.enum.LOBBY, { invalidInput: 'cannot start a game that has already been started' });
    assert(game.playerIds[0] === userId, { invalidInput: 'only the owner can start the game' });

    const originalGame = game.toApi();
    const engine = new Engine();
    const { gameData, logs, activePlayerId } = engine.start(game.playerIds, { mapKey: game.gameKey });

    // TODO: save the logs
    game.gameData = gameData;
    game.status = GameStatus.enum.ACTIVE;
    game.activePlayerId = activePlayerId;
    const newGame = await game.save();
    emitGameUpdate(originalGame, newGame);
    return { status: 200, body: { game: newGame.toApi() } };
  },

  async setGameData({ req, params, body }) {
    assert(environment.stage === Stage.enum.development);
    const game = await GameModel.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    const originalGame = game.toApi();
    game.gameData = body.gameData;
    await game.save();
    emitGameUpdate(originalGame, game);
    return { status: 200, body: { game: game.toApi() } };
  },

  async performAction({ req, params, body }) {
    return await sequelize.transaction(async (transaction) => {
      const userId = req.session.userId;
      assert(userId != null, { permissionDenied: true });

      const game = await GameModel.findByPk(params.gameId, { transaction });
      assert(game != null);
      assert(game.status === GameStatus.enum.ACTIVE, 'cannot perform an action unless the game is live');
      assert(game.gameData != null);
      assert(game.activePlayerId === req.session.userId, { permissionDenied: true });

      const originalGame = game.toApi();
      const engine = new Engine();

      const { gameData, logs, activePlayerId, gameStatus, reversible } =
        engine.processAction(game.gameKey, game.gameData, body.actionName, body.actionData);

      const gameHistory = GameHistoryModel.build({
        gameVersion: game.version,
        patch: '',
        previousGameData: game.gameData,
        actionName: body.actionName,
        actionData: JSON.stringify(body.actionData),
        reversible,
        gameId: game.id,
        userId,
      });

      game.version = game.version + 1;
      game.gameData = gameData;
      game.activePlayerId = activePlayerId;
      game.status = gameStatus === GameEngineStatus.ENDED ? GameStatus.enum.ENDED : GameStatus.enum.ACTIVE;
      game.undoPlayerId = reversible ? userId : undefined;
      const newGame = await game.save({ transaction });
      await gameHistory.save({ transaction });
      const createLogs = logs.map((message): CreateLogModel => ({
        gameId: game.id,
        message,
        gameVersion: game.version,
      }));
      const newLogs = await LogModel.bulkCreate(createLogs, { transaction });

      transaction.afterCommit(() => {
        emitToRoom(newLogs);
        emitGameUpdate(originalGame, newGame);
      });

      return { status: 200, body: { game: newGame.toApi() } };
    });
  },

  async undoAction({ req, params: { gameId }, body: { version } }) {
    return await sequelize.transaction(async transaction => {
      const gameHistory = await GameHistoryModel.findOne({ where: { gameId, gameVersion: version }, transaction });
      const game = await GameModel.findByPk(gameId, { transaction });
      assert(game != null);
      assert(gameHistory != null);
      assert(gameHistory.reversible, { invalidInput: 'cannot undo reversible action' });
      assert(game.version === gameHistory.gameVersion + 1, 'can only undo one step');
      assert(gameHistory.userId === req.session.userId, { permissionDenied: true });

      const originalGame = game.toApi();

      game.version = version;
      game.gameData = gameHistory.previousGameData;
      game.activePlayerId = gameHistory.userId;

      const versionBefore = await GameHistoryModel.findOne({ where: { gameId, gameVersion: version - 1 }, transaction });
      game.undoPlayerId = versionBefore != null && versionBefore.reversible ? versionBefore.userId : undefined;
      const newGame = await game.save({ transaction });
      await GameHistoryModel.destroy({ where: { gameVersion: { [Op.gte]: version } }, transaction });
      await LogModel.destroy({ where: { gameVersion: { [Op.gte]: version } }, transaction });

      transaction.afterCommit(() => {
        emitLogsDestroyToRoom(newGame);
        emitGameUpdate(originalGame, newGame);
      });

      return { status: 200, body: { game: newGame.toApi() } };
    });
  },

  async retryLast({ req, body, params }) {
    enforceRole(req, UserRole.enum.ADMIN);
    const limit = 'steps' in body ? body.steps : 20;
    const previousActions = await GameHistoryModel.findAll({ where: { gameId: params.gameId }, limit, order: [['id', 'DESC']] });
    const game = await GameModel.findByPk(params.gameId);
    assert(game != null, { notFound: true });
    if ('steps' in body) {
      assert(previousActions.length == body.steps, { invalidInput: 'There are not that many steps to retry' });
    } else {
      assert(previousActions.length < limit, { invalidInput: 'Cannot start over if already twenty steps in' });
    }

    const originalGame = game.toApi();

    const engine = new Engine();

    let previousAction: GameHistoryModel | undefined;
    let currentGameData: string | undefined;
    let currentGameVersion: number | undefined;
    let finalActivePlayerId: number | undefined;
    let finalUndoPlayerId: number | undefined;
    const allLogs: LogModel[] = [];
    if ('startOver' in body && body.startOver) {
      const { gameData, logs, activePlayerId } = engine.start(game.playerIds, { mapKey: game.gameKey });
      currentGameData = gameData;
      currentGameVersion = 1;
      finalActivePlayerId = activePlayerId;
      allLogs.push(...logs.map((message) => LogModel.build({
        gameId: game.id,
        message,
        gameVersion: currentGameVersion,
      })));
    } else {
      currentGameData = peek(previousActions).previousGameData;
      currentGameVersion = peek(previousActions).gameVersion;
    }
    let firstGameVersion = currentGameVersion;
    let finalGameStatus: GameEngineStatus | undefined;
    const newHistory: GameHistoryModel[] = [];
    while (previousAction = previousActions.pop()) {
      const { gameData, logs, activePlayerId, gameStatus, reversible } =
        engine.processAction(game.gameKey, currentGameData, previousAction.actionName, JSON.parse(previousAction.actionData));

      newHistory.push(GameHistoryModel.build({
        gameVersion: currentGameVersion,
        patch: '',
        previousGameData: currentGameData,
        actionName: previousAction.actionName,
        actionData: previousAction.actionData,
        reversible,
        gameId: game.id,
        userId: previousAction.userId,
      }));

      currentGameVersion++;
      currentGameData = gameData;
      allLogs.push(...logs.map(message => LogModel.build({
        gameId: game.id,
        message,
        gameVersion: currentGameVersion,
      })));
      finalGameStatus = gameStatus;
      finalActivePlayerId = activePlayerId;
      finalUndoPlayerId = reversible ? previousAction.userId : undefined;
    }

    game.version = currentGameVersion;
    game.gameData = currentGameData;
    game.activePlayerId = finalActivePlayerId;
    game.status = finalGameStatus === GameEngineStatus.ENDED ? GameStatus.enum.ENDED : GameStatus.enum.ACTIVE;
    game.undoPlayerId = finalUndoPlayerId;
    await sequelize.transaction(async (transaction) => {
      await Promise.all([
        game.save({ transaction }),
        LogModel.destroy({ where: { gameVersion: { [Op.gte]: firstGameVersion } }, transaction }),
        GameHistoryModel.destroy({ where: { gameVersion: { [Op.gte]: firstGameVersion } }, transaction }),
        ...newHistory.map((history) => history.save({ transaction })),
        ...allLogs.map(log => log.save({ transaction })),
      ]);
    });

    emitLogsReplaceToRoom(game, allLogs, firstGameVersion);
    emitGameUpdate(originalGame, game);

    return { status: 200, body: { game: game.toApi() } };
  },
});

createExpressEndpoints(gameContract, router, gameApp);
