import { Action, ActionNamingProvider } from "../../engine/state/action";

export class PolandActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "The player choosing the Production action may pull a Goods cube from the bag and place it in any Town.";
    }
    return super.getActionDescription(action);
  }
}
