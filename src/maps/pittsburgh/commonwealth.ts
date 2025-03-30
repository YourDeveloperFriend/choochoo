import { Set } from "immutable";
import z from "zod";
import { BuildData } from "../../engine/build/build";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuildDiscountManager } from "../../engine/build/discount";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";

export class PittsburghAllowedActions extends AllowedActions {
  getActions(): Set<Action> {
    return super
      .getActions()
      .remove(Action.TURN_ORDER_PASS)
      .add(Action.COMMONWEALTH);
  }
}

const BuildDiscountState = z.object({
  usedDiscount: z.boolean(),
});
type BuildDiscountState = z.infer<typeof BuildDiscountState>;

const BUILD_DISCOUNT = new Key("buildDiscount", {
  parse: BuildDiscountState.parse,
});

export class PittsburghBuildDiscountManager extends BuildDiscountManager {
  private readonly buildState = injectState(BUILD_DISCOUNT);
  private readonly costCalculator = inject(BuildCostCalculator);
  private readonly currentPlayer = injectCurrentPlayer();

  getDiscount(data: BuildData): number {
    if (this.buildState.isInitialized() && this.buildState().usedDiscount) {
      return 0;
    }
    if (this.currentPlayer().selectedAction !== Action.COMMONWEALTH) {
      return 0;
    }
    const costBeforeDiscount = this.costCalculator.costOf(
      data.coordinates,
      data.tileType,
      data.orientation,
    );
    return costBeforeDiscount === 10 ? 3 : 0;
  }

  applyDiscount(data: BuildData): void {
    if (this.getDiscount(data) > 0) {
      this.buildState.initState({ usedDiscount: true });
    }
  }
}
