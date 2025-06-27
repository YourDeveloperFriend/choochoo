import { Action, ActionNamingProvider } from "../../engine/state/action";

export class ScotlandActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.TURN_ORDER_PASS) {
      return "Become first player in the next round skipping auction phase.";
    }
    return super.getActionDescription(action);
  }
}
