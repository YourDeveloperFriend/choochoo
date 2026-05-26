import { Set as ImmutableSet } from "immutable";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";

export class CentralNewEnglandAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().withMutations((set) => {
      set.add(Action.SMUGGLE);
    });
  }
}
