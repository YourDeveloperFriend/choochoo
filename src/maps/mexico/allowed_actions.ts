import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionZod } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";

const MexicoDisabledActionsZod = z.object({
  actions: z.array(ActionZod),
});

export const MEXICO_DISABLED_ACTIONS = new Key("mexicoDisabledActions", {
  parse: MexicoDisabledActionsZod.parse,
});

export class MexicoAllowedActions extends AllowedActions {
  private readonly disabledActions = injectState(MEXICO_DISABLED_ACTIONS);

  getActions(): ImmutableSet<Action> {
    return super
      .getActions()
      .delete(Action.PRODUCTION)
      .delete(Action.TURN_ORDER_PASS);
  }

  getDisabledActionReason(action: Action): string | undefined {
    const { actions } = this.disabledActions();
    if (actions.includes(action)) {
      return "This action is unavailable this round.";
    }
    return undefined;
  }
}
