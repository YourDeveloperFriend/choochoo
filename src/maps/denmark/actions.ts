import { Action, ActionNamingProvider } from "../../engine/state/action";

export class DenmarkActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Temporarily increase your loco to the next available level.";
    }
    return super.getActionDescription(action);
  }
}
