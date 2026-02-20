import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";

export class EasternUsAndCanadaAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().remove(Action.ENGINEER).add(Action.MARKETING);
  }
}

export class EasternUsAndCanadaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "Immediately draw two cubes from the bag and then place them on two different cities of your choice.";
    }
    if (action === Action.URBANIZATION) {
      return "Place a new city on any town during the build step. Immediately put two cubes from the bag on the placed city.";
    }
    return super.getActionDescription(action);
  }
}
