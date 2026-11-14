import { Action, ActionNamingProvider } from "../../engine/state/action";

export class NwIndianaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.ENGINEER) {
      return "Build 4 track, OR build 2 track with the total cost halved (rounded up).";
    }
    return super.getActionDescription(action);
  }
}
