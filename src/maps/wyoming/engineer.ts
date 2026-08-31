import z from "zod";
import { BuildData } from "../../engine/build/build";
import { BuildDiscountManager } from "../../engine/build/discount";
import { BUILD_STATE } from "../../engine/build/state";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

const ENGINEER_MOST_EXPENSIVE = new Key(
  "wyomingEngineerMostExpensive",
  z.number(),
);

const FOURTH_BUILD_INDEX = 3;

/**
 * Wyoming's Engineer action lets the player build up to four track, or build up to
 * three track with the most expensive of those free. The logic tracks the most
 * expensive build cost seen so far and discounts each new maximum by the amount it
 * exceeds the previous one, so the total discount across the round equals the
 * single most expensive build. If the player goes on to lay a fourth track, that
 * build is surcharged by the tracked maximum, canceling out the discount entirely.
 */
export class WyomingDiscountManager extends BuildDiscountManager {
  private readonly mostExpensive = injectState(ENGINEER_MOST_EXPENSIVE);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly buildState = injectState(BUILD_STATE);

  onBuildRoundEnd() {
    if (this.mostExpensive.isInitialized()) {
      this.mostExpensive.delete();
    }
  }

  private buildCount(): number {
    return (
      this.buildState().buildCount ?? this.buildState().previousBuilds.length
    );
  }

  getMinimumBuild(): number {
    return this.currentPlayer().selectedAction === Action.ENGINEER &&
      !this.mostExpensive.isInitialized()
      ? 0
      : 2;
  }

  getDiscount(_: BuildData, cost: number): number {
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) {
      return 0;
    }
    if (this.buildCount() === FOURTH_BUILD_INDEX) {
      return this.mostExpensive.isInitialized() ? -this.mostExpensive() : 0;
    }
    if (!this.mostExpensive.isInitialized()) {
      return cost;
    }
    const mostExpensive = this.mostExpensive();
    return cost > mostExpensive ? cost - mostExpensive : 0;
  }

  applyDiscount(_: BuildData, originalCost: number): void {
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) return;
    if (this.buildCount() === FOURTH_BUILD_INDEX) return;
    if (this.mostExpensive.isInitialized()) {
      this.mostExpensive.set(Math.max(originalCost, this.mostExpensive()));
    } else {
      this.mostExpensive.initState(originalCost);
    }
  }
}
