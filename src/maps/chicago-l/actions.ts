import { Action, ActionNamingProvider } from "../../engine/state/action";

export class ChicagoLActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Move your loco up (vertically) on the loco track.";
    } else if (action === Action.ENGINEER) {
      return "Your most expensive build is free.";
    }
    return super.getActionDescription(action);
  }
}
