import { injectPlayerAction } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { PlayerColor, stringToPlayerColor } from "../../engine/state/player";
import { TurnOrderHelper } from "../../engine/turn_order/helper";

/**
 * The player who selected First Move only needs to match the current highest
 * bid (rather than exceed it). Matching makes them the leader, so other players
 * must still bid.
 */
export class WyomingTurnOrderHelper extends TurnOrderHelper {
  private readonly firstMovePlayer = injectPlayerAction(Action.FIRST_MOVE);

  getMinBid(): number {
    if (this.firstMovePlayer()?.color === this.currentPlayer().color) {
      return Math.max(1, this.getCurrentMaxBid());
    }
    return super.getMinBid();
  }

  /** Ties for the max bid go to the First Move player (who may match a bid). */
  getCurrentMaxBidPlayer(): PlayerColor | undefined {
    const { previousBids } = this.turnOrderState();
    const maxBid = this.getCurrentMaxBid();
    const leaders = Object.keys(previousBids)
      .filter((p) => previousBids[p] === maxBid)
      .map(stringToPlayerColor);
    if (leaders.length === 0) return undefined;
    const firstMove = this.firstMovePlayer()?.color;
    return leaders.find((color) => color === firstMove) ?? leaders[0];
  }
}
