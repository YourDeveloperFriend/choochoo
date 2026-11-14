import z from "zod";
import { BuildData } from "../../engine/build/build";
import { ClaimData } from "../../engine/build/claim";
import { ConnectCitiesData } from "../../engine/build/connect_cities";
import { BuildDiscountManager } from "../../engine/build/discount";
import { BUILD_STATE } from "../../engine/build/state";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { Action } from "../../engine/state/action";

type AnyBuild = BuildData | ClaimData | ConnectCitiesData;

// Total (winter-adjusted, pre-Engineer) cost of the builds made so far this turn by a player using Engineer.
const RAW_BUILD_TOTAL = new Key("nwIndianaRawBuildTotal", {
  parse: z.number().parse,
});

/**
 * Winter (even rounds) doubles all building costs.
 *
 * Engineer lets a player either build up to 4 track at full price, or build 2 track at half the
 * total cost (rounded up). We figure out which option is being used from the build count: the first
 * two builds are charged at the halved rate (each build costs the change in ceil(total / 2)), but
 * as soon as a third build is made the player has chosen the 4-track option, so that build also
 * pays back the discount previously received on the first two.
 */
export class NwIndianaDiscountManager extends BuildDiscountManager {
  private readonly rawTotal = injectState(RAW_BUILD_TOTAL);
  private readonly buildState = injectState(BUILD_STATE);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly round = injectState(ROUND);

  private isWinter(): boolean {
    return this.round() % 2 === 0;
  }

  private isEngineer(): boolean {
    return this.currentPlayer().selectedAction === Action.ENGINEER;
  }

  private getRawTotal(): number {
    return this.rawTotal.isInitialized() ? this.rawTotal() : 0;
  }

  private buildCount(): number {
    const state = this.buildState();
    return state.buildCount ?? state.previousBuilds.length;
  }

  private adjustedCost(cost: number): number {
    return this.isWinter() ? cost * 2 : cost;
  }

  getMinimumBuild(): number {
    const min = this.adjustedCost(super.getMinimumBuild());
    if (this.isEngineer() && this.buildCount() < 2) {
      return Math.ceil(min / 2);
    }
    return min;
  }

  getDiscount(_: AnyBuild, cost: number): number {
    const adjusted = this.adjustedCost(cost);
    if (!this.isEngineer()) return cost - adjusted;
    const before = this.getRawTotal();
    let charged: number;
    if (this.buildCount() < 2) {
      // Half-cost option.
      charged = Math.ceil((before + adjusted) / 2) - Math.ceil(before / 2);
    } else if (this.buildCount() === 2) {
      // Third build: committing to the 4-track option, so repay the earlier discount.
      charged = adjusted + (before - Math.ceil(before / 2));
    } else {
      charged = adjusted;
    }
    return cost - charged;
  }

  applyDiscount(_: AnyBuild, originalCost: number): void {
    if (!this.isEngineer()) return;
    const total = this.getRawTotal() + this.adjustedCost(originalCost);
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
