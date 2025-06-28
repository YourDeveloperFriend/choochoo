import { Action, ActionNamingProvider } from "../../engine/state/action";

export class SoulTrainActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action == Action.ENGINEER) {
      return "Cut the total cost of your build in half (rounded up).";
    }
    return super.getActionDescription(action);
  }
}
