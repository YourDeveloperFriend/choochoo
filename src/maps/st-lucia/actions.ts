import { Action, ActionNamingProvider } from "../../engine/state/action";

export class StLuciaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.TURN_ORDER_PASS) {
      return "Go first in the next auction.";
    }
    return super.getActionDescription(action);
  }
}
