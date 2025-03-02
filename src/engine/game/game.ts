import { infiniteLoopCheck } from "../../utils/functions";
import { assert, assertNever } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { GridData } from "../state/grid";
import { InterCityConnection } from "../state/inter_city_connection";
import { Ender, EndGameReason } from "./ender";
import {
  CheckAutoAction as CheckForcedAction,
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
import { Memory } from "./memory";
import { PHASE, PhaseEngine } from "./phase";
import { PhaseDelegator } from "./phase_delegator";
import { PlayerHelper } from "./player";
import { ROUND, RoundEngine } from "./round";
import { GameStarter } from "./starter";
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
  private readonly lifecycle = inject(Memory).remember<
    LifecycleStage | undefined
  >(undefined);
  private readonly currentPlayer = injectState(CURRENT_PLAYER);
  readonly hasEnded = inject(Memory).remember(false);

  start(
    playerIds: number[],
    startingMap: GridData,
    connections: InterCityConnection[],
  ) {
    this.starter.startGame(playerIds, startingMap, connections);
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

  private runLifecycle(): void {
    const checkInfinite = infiniteLoopCheck(50);
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
      this.lifecycle.set(lifecycle.checkForcedAction());
    } else if (lifecycle instanceof CheckForcedAction) {
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

  end(endGameReason: EndGameReason): void {
    this.ender.endGame(endGameReason);
    this.hasEnded.set(true);
  }
}
