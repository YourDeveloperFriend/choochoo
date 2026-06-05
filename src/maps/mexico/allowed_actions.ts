import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { Key } from "../../engine/framework/key";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionZod } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";
import { MexicoVariantConfig } from "./variant_config";

const MexicoDisabledActionsZod = z.object({
  actions: z.array(ActionZod),
});

export const MEXICO_DISABLED_ACTIONS = new Key("mexicoDisabledActions", {
  parse: MexicoDisabledActionsZod.parse,
});

export class MexicoAllowedActions extends AllowedActions {
  private readonly disabledActions = injectState(MEXICO_DISABLED_ACTIONS);
  private readonly gameMemory = inject(GameMemory);

  getActions(): ImmutableSet<Action> {
    const { productionForAll } = this.gameMemory.getVariant(
      MexicoVariantConfig.parse,
    );
    let actions = super.getActions().delete(Action.TURN_ORDER_PASS);
    if (!productionForAll) {
      actions = actions.delete(Action.PRODUCTION);
    }
    return actions;
  }

  getDisabledActionReason(action: Action): string | undefined {
    const { actions } = this.disabledActions();
    if (actions.includes(action)) {
      return "This action is unavailable this round.";
    }
    return undefined;
  }
}
