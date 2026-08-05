import { injectInitialPlayerCount } from "../../engine/game/state";
import { Action, ActionNamingProvider } from "../../engine/state/action";

export class WyomingActionNamingProvider extends ActionNamingProvider {
  private readonly playerCount = injectInitialPlayerCount();

  getActionDescription(action: Action): string {
    switch (action) {
      case Action.ENGINEER:
        return "Place up to four track during the Building step. Your least expensive track is free.";
      case Action.FIRST_MOVE:
        return "Go first during the Move Goods step. Next turn, issue shares last during the Issue Shares phase, no matter your turn order.";
      case Action.LOCOMOTIVE:
        if (this.playerCount() === 2) {
          return "Temporarily increase your locomotive by one during the Move Goods step.";
        }
        return super.getActionDescription(action);
      default:
        return super.getActionDescription(action);
    }
  }
}
