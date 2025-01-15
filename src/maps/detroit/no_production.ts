import { Set } from "immutable";
import { PhaseEngine } from "../../engine/game/phase";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";

export class DetroitPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return super.phaseOrder().filter((phase) => phase !== Phase.GOODS_GROWTH);
  }
}

export class DetroitAllowedActions extends AllowedActions {
  getAvailableActions(): Set<Action> {
    return super.getAvailableActions().remove(Action.PRODUCTION);
  }
}