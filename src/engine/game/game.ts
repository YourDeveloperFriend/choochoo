import { infiniteLoopCheck } from "../../utils/functions";
import { assert, assertNever } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { Ender, EndGameReason } from "./ender";
import {
  CheckAutoAction,
  EndPhase,
  EndRound,
  EndTurn,
  LifecycleStage,
  ProcessAction,
  StartPhase,
  StartRound,
  StartTurn,
  WaitForAction,
} from "./lifecycle";
import { Log } from "./log";
import { Memory } from "./memory";
import { MoneyManager } from "./money_manager";
import { PHASE, PhaseEngine } from "./phase";
import { PhaseDelegator } from "./phase_delegator";
import { PlayerHelper } from "./player";
import { ROUND, RoundEngine } from "./round";
import { GameStarter, PlayerUser } from "./starter";
import { CURRENT_PLAYER } from "./state";
import { TurnEngine } from "./turn";

export class GameEngine {
  private readonly playerHelper = inject(PlayerHelper);
  private readonly starter = inject(GameStarter);
  private readonly delegator = inject(PhaseDelegator);
  private readonly roundEngine = inject(RoundEngine);
  private readonly ender = inject(Ender);
  private readonly round = injectState(ROUND);
  private readonly phaseEngine = inject(PhaseEngine);
  private readonly phase = injectState(PHASE);
  private readonly turn = inject(TurnEngine);
  private readonly moneyManager = inject(MoneyManager);
  private readonly log = inject(Log);
  private readonly lifecycle = inject(Memory).remember<
    LifecycleStage | undefined
  >(undefined);
  private readonly currentPlayer = injectState(CURRENT_PLAYER);
  readonly hasEnded = inject(Memory).remember(false);

  start(
    players: PlayerUser[],
    startingMap: GridData,
    connections: InterCityConnection[],
  ) {
    this.starter.startGame(players, startingMap, connections);
    this.lifecycle.set(new StartRound(1));
    this.runLifecycle();
  }

  processAction(actionName: string, data: unknown): void {
    this.lifecycle.set(
      new ProcessAction(
        this.round(),
        this.phase(),
        this.currentPlayer(),
        actionName,
        data,
      ),
    );
    this.runLifecycle();
  }

  private shouldGameEndPrematurely(): EndGameReason | undefined {
    return this.playerHelper.enoughPlayersEliminatedToEndGame()
      ? EndGameReason.PLAYERS_ELIMINATED
      : undefined;
  }

  protected runLifecycle(): void {
    const checkInfinite = infiniteLoopCheck(100);
    while (!this.hasEnded() && !(this.lifecycle() instanceof WaitForAction)) {
      checkInfinite(`${this.lifecycle()!.constructor.name}`);
      this.stepLifecycle();
    }
  }

  private stepLifecycle(): void {
    const endGameReason = this.shouldGameEndPrematurely();
    if (endGameReason != null) {
      this.end(endGameReason);
      return;
    }

    const lifecycle = this.lifecycle();
    assert(lifecycle != null);
    assert(!(lifecycle instanceof WaitForAction));

    if (lifecycle instanceof StartRound) {
      this.roundEngine.start(lifecycle.round);
      this.lifecycle.set(
        lifecycle.startPhase(this.phaseEngine.getFirstPhase()),
      );
    } else if (lifecycle instanceof StartPhase) {
      this.phaseEngine.start(lifecycle.phase);
      const firstPlayer = this.delegator.get().getFirstPlayer();
      if (firstPlayer != null) {
        this.lifecycle.set(lifecycle.startTurn(firstPlayer));
        return;
      }
      this.lifecycle.set(lifecycle.endPhase());
    } else if (lifecycle instanceof StartTurn) {
      this.turn.start(lifecycle.currentPlayer);
      if (this.delegator.get().checkSkipTurn()) {
        this.lifecycle.set(lifecycle.skipTurn());
      } else {
        this.lifecycle.set(lifecycle.checkForcedAction());
      }
    } else if (lifecycle instanceof CheckAutoAction) {
      const autoAction = this.delegator.get().forcedAction();
      if (autoAction != null) {
        this.lifecycle.set(
          lifecycle.processAction(autoAction.action.action, autoAction.data),
        );
        return;
      }
      this.lifecycle.set(lifecycle.waitForAction());
    } else if (lifecycle instanceof ProcessAction) {
      const endsTurn = this.delegator
        .get()
        .processAction(lifecycle.actionName, lifecycle.data);
      if (endsTurn) {
        this.lifecycle.set(lifecycle.endTurn());
        return;
      }

      this.lifecycle.set(lifecycle.checkAutoAction());
    } else if (lifecycle instanceof EndTurn) {
      this.turn.end();
      const nextPlayer = this.delegator
        .get()
        .findNextPlayer(lifecycle.currentPlayer);
      if (nextPlayer != null) {
        this.lifecycle.set(lifecycle.startTurn(nextPlayer));
        return;
      }
      this.lifecycle.set(lifecycle.endPhase());
    } else if (lifecycle instanceof EndPhase) {
      this.phaseEngine.end();
      const nextPhase = this.phaseEngine.findNextPhase(lifecycle.phase);
      if (nextPhase != null) {
        this.lifecycle.set(lifecycle.startPhase(nextPhase));
        return;
      }
      this.lifecycle.set(lifecycle.endRound());
    } else if (lifecycle instanceof EndRound) {
      this.roundEngine.end();
      if (this.roundEngine.isLastRound(lifecycle.round)) {
        this.end(EndGameReason.ROUNDS_ENDED);
        return;
      }
      this.lifecycle.set(lifecycle.startNextRound());
    } else {
      assertNever(lifecycle);
    }
  }

  eliminateActivePlayer(logMessage: string): void {
    const playerColor = this.currentPlayer();
    this.log.log(logMessage);

    if (this.phase() === Phase.TURN_ORDER) {
      if (this.doEliminate(playerColor)) return;
      this.lifecycle.set(
        new CheckAutoAction(this.round(), this.phase(), playerColor),
      );
      this.runLifecycle();
      return;
    }

    const playerOrder = this.delegator.get().getPlayerOrder();
    const playerIndex = playerOrder.indexOf(playerColor);
    const nextPlayer: PlayerColor | undefined =
      playerIndex >= 0 ? playerOrder[playerIndex + 1] : undefined;

    this.turn.end();
    if (this.doEliminate(playerColor)) return;

    if (nextPlayer != null) {
      this.lifecycle.set(new StartTurn(this.round(), this.phase(), nextPlayer));
    } else {
      this.lifecycle.set(new EndPhase(this.round(), this.phase()));
    }
    this.runLifecycle();
  }

  eliminateNonActivePlayer(playerColor: PlayerColor, logMessage: string): void {
    this.log.log(logMessage);
    this.doEliminate(playerColor);
  }

  private doEliminate(playerColor: PlayerColor): boolean {
    if (this.phase() === Phase.TURN_ORDER) {
      this.moneyManager.forceOutOfGameKeepTurnOrder(playerColor);
    } else {
      this.moneyManager.forceOutOfGame(playerColor);
    }
    const endReason = this.shouldGameEndPrematurely();
    if (endReason != null) {
      this.end(endReason);
      return true;
    }
    return false;
  }

  end(endGameReason: EndGameReason): void {
    this.ender.endGame(endGameReason);
    this.hasEnded.set(true);
  }
}
