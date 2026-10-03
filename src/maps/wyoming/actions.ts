import { injectInitialPlayerCount } from "../../engine/game/state";
import { Action, ActionNamingProvider } from "../../engine/state/action";

export class WyomingActionNamingProvider extends ActionNamingProvider {
  private readonly playerCount = injectInitialPlayerCount();

  getActionDescription(action: Action): string {
    switch (action) {
      case Action.FIRST_MOVE:
        return "Go first during the Move Goods step. Next turn, you only need to match the current highest bid (rather than exceed it) in the turn order auction.";
      case Action.LOCOMOTIVE:
        if (this.playerCount() === 2) {
          return "Pay $2 to gain a loco disc.";
        }
        return super.getActionDescription(action);
      default:
        return super.getActionDescription(action);
    }
  }
}
