import { InstanceUpdateOptions, TransactionNestMode } from "@sequelize/core";
import { GameApi, GameStatus } from "../../api/game";
import { EngineDelegator } from "../../engine/framework/engine";
import {
  AUTO_ACTION_NAME,
  AutoAction,
  NoAutoActionError,
} from "../../engine/state/auto_action";
import { ErrorCode } from "../../utils/error_code";
import { log, logError } from "../../utils/functions";
import { afterTransaction } from "../../utils/transaction";
import { assert } from "../../utils/validate";
import { LogDao } from "../messages/log_dao";
import { sequelize } from "../sequelize";
import { UserDao } from "../user/dao";
import { Lifecycle } from "../util/lifecycle";
import { notifyTurn } from "../util/turn_notification";
import { GameDao } from "./dao";
import { GameHistoryDao } from "./history_dao";

export async function startGame(
  gameId: number,
  enforceOwner?: number,
  inputSeed?: string,
): Promise<GameApi> {
  const game = await GameDao.findByPk(gameId);

  assert(game != null);
  assert(game.status === GameStatus.enum.LOBBY, {
    invalidInput: "cannot start a game that has already been started",
  });
  assert(enforceOwner == null || game.playerIds[0] === enforceOwner, {
    invalidInput: "only the owner can start the game",
  });
  assert(
    game.playerIds.length >= game.toLiteApi().config.minPlayers,
    "not enough players to start the game",
  );

  const users = await Promise.all(
    game.playerIds.map((id) => UserDao.getUser(id)),
  );

  const { gameData, logs, activePlayerId, seed } =
    EngineDelegator.singleton.start({
      players: users.map((user) => ({
        playerId: user!.id,
        preferredColors: user!.preferredColors,
      })),
      seed: inputSeed,
      game: game.toLimitedGame(),
    });

  game.turnStartTime = new Date();
  game.gameData = gameData;
  game.status = GameStatus.enum.ACTIVE;
  game.activePlayerId = activePlayerId ?? null;

  const gameHistory = GameHistoryDao.build({
    previousGameVersion: game.version - 1,
    reversible: false,
    seed,
    gameId: game.id,
  });

  const [newGame] = await sequelize.transaction(
    { nestMode: TransactionNestMode.separate },
    (transaction) =>
      Promise.all([
        game.save({ transaction }),
        gameHistory.save({ transaction }),
        LogDao.createForGame(game.id, game.version - 1, logs, transaction),
      ]),
  );

  notifyTurn(newGame).catch((e) => {
    logError("Failed during processAsync", e);
  });

  return newGame.toApi();
}

export async function performAction(
  gameId: number,
  playerId: number,
  actionName: string,
  actionData: unknown,
  confirmed: boolean,
  dryRun?: boolean,
): Promise<GameDao> {
  return await sequelize.transaction(
    { nestMode: TransactionNestMode.separate },
    async (transaction) => {
      const game = await GameDao.findByPk(gameId, { transaction });
      assert(game != null);
      assert(
        game.status === GameStatus.enum.ACTIVE,
        "cannot perform an action unless the game is live",
      );
      assert(game.gameData != null);
      assert(game.activePlayerId === playerId, { permissionDenied: true });

      const {
        gameData,
        logs,
        activePlayerId,
        hasEnded,
        reversible,
        seed,
        autoActionMutations,
      } = EngineDelegator.singleton.processAction(game.gameKey, {
        game: game.toLimitedGame(),
        actionName,
        actionData,
      });

      if (dryRun) return game;

      assert(confirmed || reversible, {
        invalidInput: "must confirm action",
        errorCode: ErrorCode.MUST_CONFIRM_ACTION,
      });

      const gameHistory = GameHistoryDao.build({
        previousGameVersion: game.version,
        previousGameData: game.gameData,
        actionName,
        actionData: JSON.stringify(actionData),
        reversible,
        seed,
        gameId: game.id,
        userId: playerId,
      });

      const playerChanged = game.activePlayerId !== activePlayerId;

      if (activePlayerId != null && activePlayerId != game.activePlayerId) {
        game.turnStartTime = new Date();
      }
      game.version = game.version + 1;
      game.gameData = gameData;
      game.activePlayerId = activePlayerId ?? null;
      game.status = hasEnded ? GameStatus.enum.ENDED : GameStatus.enum.ACTIVE;
      game.undoPlayerId = reversible ? playerId : null;

      for (const mutation of autoActionMutations) {
        const autoAction = game.getAutoActionForUser(mutation.playerId);
        mutation.mutation(autoAction);
        game.setAutoActionForUser(mutation.playerId, autoAction);
      }

      const [newGame, newGameHistory] = await Promise.all([
        game.save({ transaction }),
        gameHistory.save({ transaction }),
        LogDao.createForGame(game.id, game.version - 1, logs),
      ]);

      log(
        `Game action id=${newGameHistory.id} reversible=${reversible} actionName=${actionName}`,
      );

      transaction.afterCommit(() => {
        if (!playerChanged) return;
        notifyTurnUnlessAutoAction(newGame).catch((e) => {
          logError("Failed during processAsync", e);
        });

        if (game.status === GameStatus.enum.ACTIVE) {
          const minutes = 1000 * 60;
          // Delay by a random number between 2 and 4 minutes.
          const autoActionDelay = minutes * 2 + Math.random() * minutes * 4;
          setTimeout(() => {
            checkForAutoAction(game.id);
          }, autoActionDelay);
        }
      });

      return newGame;
    },
  );
}

async function notifyTurnUnlessAutoAction(game: GameDao): Promise<void> {
  const hasAutoAction = await checkForAutoAction(game.id, /* dryRun= */ true);
  if (!hasAutoAction) {
    return notifyTurn(game);
  }
}

export async function abandonGame(
  game: GameDao,
  userId: number,
  kicked: boolean,
): Promise<void> {
  assert(game.playerIds.includes(userId), { permissionDenied: true });
  assert(game.status === GameStatus.enum.ACTIVE, {
    invalidInput: "Can only abandon an active game",
  });
  game.status = GameStatus.enum.ABANDONED;
  game.activePlayerId = null;
  const user = await UserDao.findByPk(userId);
  assert(user != null);
  user.abandons++;
  await sequelize.transaction(async (transaction) => {
    await Promise.all([
      game.save({ transaction }),
      user.save({ transaction }),
      LogDao.createForGame(
        game.id,
        game.version,
        [
          kicked
            ? `<@user-${userId}> ran out of time and was kicked from the game.`
            : `<@user-${userId}> abandoned the game.`,
        ],
        transaction,
      ),
    ]);
  });
}

async function checkForAutoAction(
  gameId: number,
  dryRun?: boolean,
): Promise<boolean> {
  let autoAction: AutoAction | undefined = undefined;
  try {
    const game = await GameDao.findByPk(gameId, { transaction: null });

    if (game == null || game.activePlayerId == null) return false;

    autoAction = game.autoAction?.users[game.activePlayerId];

    if (autoAction == null) return false;

    await performAction(
      gameId,
      game.activePlayerId,
      AUTO_ACTION_NAME,
      autoAction,
      /** confirmed= */ true,
      dryRun,
    );
    return true;
  } catch (e) {
    if (e instanceof NoAutoActionError) return false;

    logError("failed to process auto action", e, gameId, autoAction);
    return false;
  }
}

export function inTheLead(game: GameDao): number[] {
  return EngineDelegator.singleton.inTheLead(game.toLimitedGame());
}

Lifecycle.singleton.onStart(() => {
  GameDao.hooks.addListener(
    "afterSave",
    (game: GameDao, options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        setTimeout(() => {
          if (
            game.status === GameStatus.enum.LOBBY &&
            game.playerIds.length === game.config.maxPlayers &&
            game.autoStart
          ) {
            startGame(game.id).catch((e) => {
              logError("error starting game", e);
            });
          }
        }, 2000);
      });
    },
  );
});
