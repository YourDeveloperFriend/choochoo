import { Set } from "immutable";
import z from "zod";
import { BuildData } from "../../engine/build/build";
import { ClaimData } from "../../engine/build/claim";
import { ConnectCitiesData } from "../../engine/build/connect_cities";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuildDiscountManager } from "../../engine/build/discount";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { assert } from "../../utils/validate";

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

function isBuildData(
  data: BuildData | ClaimData | ConnectCitiesData,
): data is BuildData {
  // There is no claim or connect cities data in Pittsburgh
  return true;
}

export class PittsburghBuildDiscountManager extends BuildDiscountManager {
  private readonly buildState = injectState(BUILD_DISCOUNT);
  private readonly costCalculator = inject(BuildCostCalculator);
  private readonly currentPlayer = injectCurrentPlayer();

  getDiscount(data: BuildData | ClaimData | ConnectCitiesData): number {
    if (this.buildState.isInitialized() && this.buildState().usedDiscount) {
      return 0;
    }
    if (this.currentPlayer().selectedAction !== Action.COMMONWEALTH) {
      return 0;
    }
    assert(isBuildData(data), "Invalid data type for discount calculation");
    const costBeforeDiscount = this.costCalculator.costOf(
      data.coordinates,
      data.tileType,
      data.orientation,
    );
    return costBeforeDiscount === 10 ? 3 : 0;
  }

  applyDiscount(data: BuildData | ClaimData | ConnectCitiesData): void {
    assert(isBuildData(data), "Invalid data type for discount calculation");
    if (this.getDiscount(data) > 0) {
      this.buildState.initState({ usedDiscount: true });
    }
  }

  onBuildRoundEnd(): void {
    if (this.buildState.isInitialized()) {
      this.buildState.delete();
    }
  }
}
