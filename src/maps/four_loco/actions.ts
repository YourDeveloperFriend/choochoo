import { Set as ImmutableSet } from "immutable";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";

/**
 * In 4 Loco, the Locomotive action is removed from the action selection phase.
 * All players start at engine level 4 and cannot increase it further.
 */
export class FourLocoAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().remove(Action.LOCOMOTIVE);
  }
}
