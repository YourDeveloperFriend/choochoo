import { injectState } from "../../engine/framework/execution_context";
import { SetKey } from "../../engine/framework/key";
import { CURRENT_PLAYER } from "../../engine/game/state";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { BidAction, BidData } from "../../engine/turn_order/bid";
import { TurnOrderPhase } from "../../engine/turn_order/phase";

/**
 * Who has actually bid this auction. The three player game uses the Montréal
 * rule: if two or more players pass without bidding, none of them gets a role.
 */
export const HAS_BID = new SetKey<PlayerColor>("IowHasBid", {
  parse: PlayerColorZod.parse,
});

export class IsleOfWightTurnOrderPhase extends TurnOrderPhase {
  private readonly hasBid = injectState(HAS_BID);

  onStart(): void {
    super.onStart();
    this.hasBid.initState(new Set());
  }
}

export class IsleOfWightBidAction extends BidAction {
  private readonly playerColor = injectState(CURRENT_PLAYER);
  private readonly hasBid = injectState(HAS_BID);

  process(data: BidData): boolean {
    this.hasBid.update((state) => {
      state.add(this.playerColor());
    });
    return super.process(data);
  }
}
