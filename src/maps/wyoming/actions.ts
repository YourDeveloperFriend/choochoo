import { injectInitialPlayerCount } from "../../engine/game/state";
import { Action, ActionNamingProvider } from "../../engine/state/action";

export class WyomingActionNamingProvider extends ActionNamingProvider {
  private readonly playerCount = injectInitialPlayerCount();

  getActionDescription(action: Action): string {
    switch (action) {
      case Action.FIRST_MOVE:
        return "Go first during the Move Goods step. Next turn, issue shares last during the Issue Shares phase, no matter your turn order.";
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
