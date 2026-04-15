import { Action, ActionNamingProvider } from "../../engine/state/action";

export class JapanActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Temporarily increase your locomotive by one for the round. Does not increase your expenses.";
    }
    if (action === Action.URBANIZATION) {
      return "Allows you to replace an existing city on the map with a new city. Limits you to two track builds.";
    }
    return super.getActionDescription(action);
  }
}
