import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";

export class UnionPacificExpressAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super
        .getActions()
        .remove(Action.PRODUCTION)
        .remove(Action.ENGINEER);
  }
}
