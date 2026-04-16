import { Set as ImmutableSet } from "immutable";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { LocoAction } from "../../engine/move/loco";
import { fail } from "../../utils/validate";

/**
 * In 4 Loco, the Locomotive action is removed from the action selection phase.
 * All players start at engine level 4 and cannot increase it further.
 */
export class FourLocoAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super.getActions().remove(Action.LOCOMOTIVE);
  }
}

/**
 * Guards against any code path that tries to invoke the Locomotive action
 * directly during the move phase.
 */
export class FourLocoLocoAction extends LocoAction {
  validate(): void {
    fail({ invalidInput: "Locomotive action is not available on this map" });
  }
}
