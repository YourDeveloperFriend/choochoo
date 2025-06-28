import { Action, ActionNamingProvider } from "../../engine/state/action";

export class DiscoActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "Draw two cubes and place them in one city after the move goods step.";
    }
    return super.getActionDescription(action);
  }
}
