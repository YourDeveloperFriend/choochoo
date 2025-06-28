import { Action, ActionNamingProvider } from "../../engine/state/action";

export class AustraliaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.URBANIZATION) {
      return "Place a new city on any town during the build step, but it uses one of your builds.";
    } else if (action === Action.ENGINEER) {
      return "Build an additional track during the Building step, and the most expensive build is free.";
    }
    return super.getActionDescription(action);
  }
}
