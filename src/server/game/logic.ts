import { InstanceUpdateOptions, TransactionNestMode } from "@sequelize/core";
import { GameApi, GameStatus } from "../../api/game";
import { EngineDelegator } from "../../engine/framework/engine";
import {
  AUTO_ACTION_NAME,
  AutoAction,
  NoAutoActionError,
} from "../../engine/state/auto_action";
import { afterTransaction } from "../../utils/transaction";
import { assert } from "../../utils/validate";
import { LogDao } from "../messages/log_dao";
import { sequelize } from "../sequelize";
import { Lifecycle } from "../util/lifecycle";
import { notifyTurn } from "../util/turn_notification";
import { GameDao } from "./dao";
import { GameHistoryDao } from "./history_dao";

export async function startGame(
  gameId: number,
  enforceOwner?: number,
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

  const { gameData, logs, activePlayerId, seed } =
    EngineDelegator.singleton.start({
      playerIds: game.playerIds,
      game: game.toLimitedGame(),
    });

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
    console.log("Failed during processAsync");
    console.error(e);
  });

  return newGame.toApi();
}

export async function performAction(
  gameId: number,
  playerId: number,
  actionName: string,
  actionData: unknown,
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

      console.log(
        Object.entries({
          previousGameVersion: game.version,
          previousGameData: game.gameData,
          actionName,
          actionData: JSON.stringify(actionData),
          reversible,
          seed,
          gameId: game.id,
          userId: playerId,
        }).map(([key, value]) =>
          [key, value?.toString().length, value].join(":"),
        ),
      );

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

      console.log(
        `Game action id=${newGameHistory.id} reversible=${reversible} actionName=${actionName}`,
      );

      transaction.afterCommit(() => {
        if (!playerChanged) return;
        console.log("notifying turn");
        notifyTurn(newGame).catch((e) => {
          console.log("Failed during processAsync");
          console.error(e);
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

async function checkForAutoAction(gameId: number) {
  let autoAction: AutoAction | undefined = undefined;
  try {
    const game = await GameDao.findByPk(gameId, { transaction: null });

    if (game == null || game.activePlayerId == null) return;

    autoAction = game.autoAction?.users[game.activePlayerId];

    if (autoAction == null) return;

    await performAction(
      gameId,
      game.activePlayerId,
      AUTO_ACTION_NAME,
      autoAction,
    );
  } catch (e) {
    if (e instanceof NoAutoActionError) return;

    console.log("failed to process auto action", gameId, autoAction);
    console.error(e);
  }
}

Lifecycle.singleton.onStart(() => {
  GameDao.hooks.addListener(
    "afterSave",
    (game: GameDao, options: InstanceUpdateOptions) => {
      afterTransaction(options, () => {
        setTimeout(() => {
          if (
            game.status === GameStatus.enum.LOBBY &&
            game.playerIds.length === game.config.maxPlayers
          ) {
            startGame(game.id).catch((e) => {
              console.log("error starting game");
              console.error(e);
            });
          }
        }, 2000);
      });
    },
  );
});
