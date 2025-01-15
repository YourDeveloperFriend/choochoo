import { Set } from "immutable";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";

export class DetroitAllowedActions extends AllowedActions {
  getAvailableActions(): Set<Action> {
    return super.getAvailableActions().remove(Action.PRODUCTION);
  }
}