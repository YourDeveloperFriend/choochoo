import { Action, ActionNamingProvider } from "../../engine/state/action";

export class LondonActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.ENGINEER) {
      return "Negotiate with the unions for lower overtime fees.";
    }
    if (action === Action.URBANIZATION) {
      return "Add a New City to the board. Must replace an existing track segment.";
    }
    return super.getActionDescription(action);
  }
}
