import z from "zod";
import { BuildData } from "../../engine/build/build";
import { BuildDiscountManager } from "../../engine/build/discount";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

const ENGINEER_FREE_BUILD = new Key("wyomingEngineerFreeBuild", z.number());

/**
 * Wyoming's Engineer action makes the single least expensive build in the round free.
 * The logic tracks the cheapest build cost seen so far and only ever charges the
 * difference, so regardless of build order the total charged equals the sum of all
 * build costs minus the single cheapest one.
 */
export class WyomingDiscountManager extends BuildDiscountManager {
  private readonly freeBuild = injectState(ENGINEER_FREE_BUILD);
  private readonly currentPlayer = injectCurrentPlayer();

  onBuildRoundEnd() {
    if (this.freeBuild.isInitialized()) {
      this.freeBuild.delete();
    }
  }

  getMinimumBuild(): number {
    return this.currentPlayer().selectedAction === Action.ENGINEER &&
      !this.freeBuild.isInitialized()
      ? 0
      : 2;
  }

  getDiscount(_: BuildData, cost: number): number {
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) {
      return 0;
    }
    if (!this.freeBuild.isInitialized()) {
      return cost;
    }
    const freeBuild = this.freeBuild();
    if (freeBuild < cost) {
      return 0;
    }
    return cost - freeBuild;
  }

  applyDiscount(_: BuildData, originalCost: number): void {
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) return;
    if (this.freeBuild.isInitialized()) {
      this.freeBuild.set(Math.min(originalCost, this.freeBuild()));
    } else {
      this.freeBuild.initState(originalCost);
    }
  }
}
