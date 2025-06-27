import { Action, ActionNamingProvider } from "../../engine/state/action";

export class MontrealActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Increases your government engine level.";
    }
    return super.getActionDescription(action);
  }
}
