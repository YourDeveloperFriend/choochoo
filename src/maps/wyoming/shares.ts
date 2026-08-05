import { SharesPhase } from "../../engine/shares/phase";
import { injectPlayerAction } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { PlayerColor } from "../../engine/state/player";
import { remove } from "../../utils/functions";

export class WyomingSharesPhase extends SharesPhase {
  private readonly firstMovePlayer = injectPlayerAction(Action.FIRST_MOVE);

  getPlayerOrder(): PlayerColor[] {
    const playerOrder = super.getPlayerOrder();
    const firstMove = this.firstMovePlayer();
    if (firstMove != null) {
      return remove(playerOrder, firstMove.color).concat([firstMove.color]);
    }
    return playerOrder;
  }
}
