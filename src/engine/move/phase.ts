import { remove } from "../../utils/functions";
import { inject, injectState } from "../framework/execution_context";
import { AutoActionManager } from "../game/auto_action_manager";
import { ActionBundle, PhaseModule } from "../game/phase_module";
import { injectPlayerAction } from "../game/state";
import { Action } from "../state/action";
import { AutoAction } from "../state/auto_action";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { LocoAction } from "./loco";
import { MoveAction } from "./move";
import { MovePassAction } from "./pass";
import { MOVE_STATE } from "./state";

export class MovePhase extends PhaseModule {
  static readonly phase = Phase.MOVING;

  protected readonly autoAction = inject(AutoActionManager);
  protected readonly moveState = injectState(MOVE_STATE);
  protected readonly firstMovePlayer = injectPlayerAction(Action.FIRST_MOVE);

  configureActions() {
    this.installAction(LocoAction);
    this.installAction(MoveAction);
    this.installAction(MovePassAction);
  }

  onStart(): void {
    super.onStart();
    this.moveState.initState({ moveRound: 0, locomotive: [] });
  }

  onEnd(): void {
    this.moveState.delete();
    super.onEnd();
  }

  numMoveRounds(): number {
    return 2;
  }

  findNextPlayer(currPlayer: PlayerColor): PlayerColor | undefined {
    const nextPlayer = super.findNextPlayer(currPlayer);
    if (nextPlayer != null) return nextPlayer;
    if (this.moveState().moveRound + 1 < this.numMoveRounds()) {
      this.moveState.update((r) => r.moveRound++);
      return this.getPlayerOrder()[0];
    }
    return undefined;
  }

  getPlayerOrder(): PlayerColor[] {
    const playerOrder = super.getPlayerOrder();
    const firstMove = this.firstMovePlayer();
    if (firstMove != null) {
      return [firstMove.color, ...remove(playerOrder, firstMove.color)];
    }
    return playerOrder;
  }

  onEndTurn(): void {
    this.autoAction.mutateCurrentPlayer((autoAction) => {
      autoAction.locoNext = undefined;
    });
    super.onEndTurn();
  }

  protected getAutoAction(
    autoAction: AutoAction,
  ): ActionBundle<object> | undefined {
    if (autoAction.locoNext === true) {
      return {
        action: LocoAction,
        data: {},
      };
    }
    return undefined;
  }
}
