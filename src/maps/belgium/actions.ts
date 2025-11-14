import { Action, ActionNamingProvider } from "../../engine/state/action";

export class BelgiumActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.ENGINEER) {
      return "Allows you to place town tiles during build.";
    }
    if (action === Action.URBANIZATION) {
      return "Allows you to replace an existing city on the map with a new city. Limits you to two track builds.";
    }
    return super.getActionDescription(action);
  }
}
