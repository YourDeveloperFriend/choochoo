import z from "zod";
import { BuildData } from "../../engine/build/build";
import { BuildDiscountManager } from "../../engine/build/discount";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

const ENGINEER_FREE_BUILD = new Key("engineerFreeBuild", z.number());

/**
 * The logic will give the user the first build for free, then if the next build is cheaper, then
 * they'll have to pay for the previously built discounted track.
 * For example, if they build track that costs $4, $2, $3, then they'll be charged $0, $4 (instead of $2), $3.
 * Another example, if they build track that costs $4, $3, $2, then they'll be charged $0, $4 (instead of $3), $3 (instead of 2).
 */
export class DetroitDiscountManager extends BuildDiscountManager {
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
