import { Action, ActionNamingProvider } from "../../engine/state/action";

export class CentralNewEnglandActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "During the goods growth phase, draw two cubes from the bag and then place them on a city of your choice.";
    }
    return super.getActionDescription(action);
  }
}
