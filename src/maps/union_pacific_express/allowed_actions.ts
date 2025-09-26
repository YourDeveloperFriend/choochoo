import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";

export class UnionPacificExpressAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    const actions = new Set<Action>(super.getActions());
    actions.delete(Action.PRODUCTION);
    actions.delete(Action.ENGINEER);
    return ImmutableSet<Action>(actions);
  }
}
