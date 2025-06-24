import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";
import { SelectAction } from "../../engine/select_action/select";

export class DenmarkSelectAction extends SelectAction {
  // Loco provides a temporary increase of loco; see DenmarkMoveHelper
  protected applyLocomotive(): void {}
}

export class DenmarkAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    const actions = new Set<Action>(super.getActions());
    actions.delete(Action.PRODUCTION);
    return ImmutableSet<Action>(actions);
  }
}
