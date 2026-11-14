import { EmptyAction } from "../../engine/game/action";
import { ActionBundle } from "../../engine/game/phase_module";
import { injectState } from "../../engine/framework/execution_context";
import {
  injectCurrentPlayer,
  injectPlayerAction,
} from "../../engine/game/state";
import { MovePassAction } from "../../engine/move/pass";
import { MOVE_STATE } from "../../engine/move/state";
import { MovePhase } from "../../engine/move/phase";
import { Action } from "../../engine/state/action";
import { PlayerColor } from "../../engine/state/player";
import { remove } from "../../utils/functions";

function injectIsForcedPass(): () => boolean {
  const currentPlayer = injectCurrentPlayer();
  const moveState = injectState(MOVE_STATE);
  return () =>
    currentPlayer().selectedAction === Action.ONE_MOVE &&
    moveState().moveRound > 0;
}

export class MadagascarMovePhase extends MovePhase {
  private readonly isForcedPass = injectIsForcedPass();
  private readonly lastMovePlayer = injectPlayerAction(Action.LAST_MOVE);

  getPlayerOrder(): PlayerColor[] {
    const playerOrder = super.getPlayerOrder();
    const lastMove = this.lastMovePlayer();
    if (lastMove != null) {
      return [...remove(playerOrder, lastMove.color), lastMove.color];
    }
    return playerOrder;
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.isForcedPass()) {
      return { action: MovePassAction, data: {} };
    }
    return super.forcedAction();
  }
}

export class MadagascarMovePassAction extends MovePassAction {
  private readonly isForcedPass = injectIsForcedPass();

  process(data: EmptyAction): boolean {
    if (this.isForcedPass()) {
      this.log.currentPlayer("loses their second move turn.");
      return true;
    }
    return super.process(data);
  }
}
