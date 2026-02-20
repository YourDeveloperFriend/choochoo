import { Action, ActionNamingProvider } from "../../engine/state/action";

export class ChicagoLActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Move your loco up (vertically) on the loco track.";
    } else if (action === Action.ENGINEER) {
      return "Your most expensive build is free.";
    } else if (action === Action.URBANIZATION) {
      return "Place a new city on any town during the build step. This uses one your builds.";
    }
    return super.getActionDescription(action);
  }
}
