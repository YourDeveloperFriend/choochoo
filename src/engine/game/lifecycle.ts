import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";

export class StartRound {
  constructor(readonly round: number) {}

  startPhase(phase: Phase): StartPhase {
    return new StartPhase(this.round, phase);
  }
}

export class StartPhase {
  constructor(
    readonly round: number,
    readonly phase: Phase,
  ) {}

  startTurn(currentPlayer: PlayerColor): StartTurn {
    return new StartTurn(this.round, this.phase, currentPlayer);
  }

  endPhase(): EndPhase {
    return new EndPhase(this.round, this.phase);
  }
}

export class StartTurn {
  constructor(
    readonly round: number,
    readonly phase: Phase,
    readonly currentPlayer: PlayerColor,
  ) {}

  skipTurn(): EndTurn {
    return new EndTurn(this.round, this.phase, this.currentPlayer);
  }

  checkForcedAction(): CheckAutoAction {
    return new CheckAutoAction(this.round, this.phase, this.currentPlayer);
  }
}

export class CheckAutoAction {
  constructor(
    readonly round: number,
    readonly phase: Phase,
    readonly currentPlayer: PlayerColor,
  ) {}

  processAction(actionName: string, data: unknown) {
    return new ProcessAction(
      this.round,
      this.phase,
      this.currentPlayer,
      actionName,
      data,
    );
  }

  waitForAction(): WaitForAction {
    return new WaitForAction(this.round, this.phase, this.currentPlayer);
  }
}

export class WaitForAction {
  constructor(
    readonly round: number,
    readonly phase: Phase,
    readonly currentPlayer: PlayerColor,
  ) {}
}

export class ProcessAction {
  constructor(
    readonly round: number,
    readonly phase: Phase,
    readonly currentPlayer: PlayerColor,
    readonly actionName: string,
    readonly data: unknown,
  ) {}

  endTurn() {
    return new EndTurn(this.round, this.phase, this.currentPlayer);
  }

  checkAutoAction() {
    return new CheckAutoAction(this.round, this.phase, this.currentPlayer);
  }
}

export class EndTurn {
  constructor(
    readonly round: number,
    readonly phase: Phase,
    readonly currentPlayer: PlayerColor,
  ) {}

  startTurn(playerColor: PlayerColor) {
    return new StartTurn(this.round, this.phase, playerColor);
  }

  endPhase() {
    return new EndPhase(this.round, this.phase);
  }
}

export class EndPhase {
  constructor(
    readonly round: number,
    readonly phase: Phase,
  ) {}

  startPhase(phase: Phase) {
    return new StartPhase(this.round, phase);
  }

  endRound() {
    return new EndRound(this.round);
  }
}

export class EndRound {
  constructor(readonly round: number) {}

  startNextRound() {
    return new StartRound(this.round + 1);
  }
}

export type LifecycleStage =
  | StartRound
  | StartPhase
  | StartTurn
  | CheckAutoAction
  | ProcessAction
  | WaitForAction
  | EndTurn
  | EndPhase
  | EndRound;
