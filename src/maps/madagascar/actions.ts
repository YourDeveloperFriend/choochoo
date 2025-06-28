import { Action, ActionNamingProvider } from "../../engine/state/action";

export class MadagascarActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Immediately, increase your locomotive by one, but you cannot build track this turn.";
    }
    if (action === Action.URBANIZATION) {
      return "Place a new city on any town during the build step, but may only build one track tile.";
    }
    return super.getActionDescription(action);
  }
}
