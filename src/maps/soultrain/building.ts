import z from "zod";
import { BuildData } from "../../engine/build/build";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuildDiscountManager } from "../../engine/build/discount";
import { BuilderHelper } from "../../engine/build/helper";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";

// Total undiscounted cost of the builds made so far this turn by a player using Engineer.
const RAW_BUILD_TOTAL = new Key("rawBuildTotal", { parse: z.number().parse });

/**
 * Engineer halves the total cost of the whole build, rounded up. Since each build is charged as
 * it is placed, the cost of a build is the change in ceil(total / 2) that it causes. For example,
 * a $2 plain tile and a $3 fire tile are charged $1 and $2, for a total of $3.
 */
export class SoulTrainDiscountManager extends BuildDiscountManager {
  private readonly rawTotal = injectState(RAW_BUILD_TOTAL);
  private readonly currentPlayer = injectCurrentPlayer();

  private isEngineer(): boolean {
    return this.currentPlayer().selectedAction === Action.ENGINEER;
  }

  private getRawTotal(): number {
    return this.rawTotal.isInitialized() ? this.rawTotal() : 0;
  }

  getDiscount(_: BuildData, cost: number): number {
    if (!this.isEngineer()) {
      return 0;
    }
    const before = this.getRawTotal();
    const charged = Math.ceil((before + cost) / 2) - Math.ceil(before / 2);
    return cost - charged;
  }

  applyDiscount(_: BuildData, originalCost: number): void {
    if (!this.isEngineer()) {
      return;
    }
    const total = this.getRawTotal() + originalCost;
    if (this.rawTotal.isInitialized()) {
      this.rawTotal.set(total);
    } else {
      this.rawTotal.initState(total);
    }
  }

  onBuildRoundEnd(): void {
    if (this.rawTotal.isInitialized()) {
      this.rawTotal.delete();
    }
  }
}

export class SoulTrainCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.HILL) {
      return 4;
    }
    return super.getCostOfLandType(type);
  }
}

export class SoulTrainBuilderHelper extends BuilderHelper {
  protected minimumBuildCost(): number {
    return 1;
  }

  getMaxBuilds(): number {
    return 6;
  }
}
