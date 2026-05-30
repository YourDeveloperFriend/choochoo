import { inject } from "../../engine/framework/execution_context";
import { TurnOrderHelper } from "../../engine/turn_order/helper";
import { PlayerData } from "../../engine/state/player";
import { MexicoRoleHelper } from "./roles";

export class MexicoTurnOrderHelper extends TurnOrderHelper {
  private readonly roles = inject(MexicoRoleHelper);

  protected computeBidCost(
    previousBid: number,
    playerOrder: number,
    numPlayers: number,
    player: PlayerData,
  ): number {
    if (playerOrder === numPlayers) return 0;
    if (this.roles.isCartel(player.color)) return Math.floor(previousBid * 0.5);
    return previousBid;
  }
}
