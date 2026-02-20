import { Set as ImmutableSet } from "immutable";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";

export class ChicagoLAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().withMutations((set) => {
      set
        .delete(Action.PRODUCTION)
        .delete(Action.TURN_ORDER_PASS)
        .add(Action.REPOPULATION)
        .add(Action.ISSUE_LAST);
    });
  }
}
