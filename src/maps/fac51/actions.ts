import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionNamingProvider } from "../../engine/state/action";

export const BLOCKED_ACTIONS = [
  Action.FIRST_MOVE,
  Action.FIRST_BUILD,
  Action.ENGINEER,
  Action.LOCOMOTIVE,
  Action.URBANIZATION,
  Action.PRODUCTION,
  Action.TURN_ORDER_PASS,
];

export class Fac51AllowedActions extends AllowedActions {
  private readonly round = injectState(ROUND);

  getDisabledActionReason(action: Action): string | undefined {
    return action === BLOCKED_ACTIONS[this.round.getOr(1) - 1]
      ? "Blocked by the round marker"
      : super.getDisabledActionReason(action);
  }
}

export class Fac51ActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    return action === Action.PRODUCTION
      ? "At the end of the round, replace either duplicated delivery colour marker with a different colour before the clockwise rotation."
      : super.getActionDescription(action);
  }
}
