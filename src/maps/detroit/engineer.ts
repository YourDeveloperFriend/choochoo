import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { BuildCostCalculator } from "../../engine/build/cost";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { TileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";

export const ENGINEER_FREE_BUILD = new Key('engineerFreeBuild', z.number());

/**
 * The logic will give the user the first build for free, then if the next build is cheaper, then
 * they'll have to pay for the previously built discounted track.
 * For example, if they build track that costs $4, $2, $3, then they'll be charged $0, $4 (instead of $2), $3.
 * Another example, if they build track that costs $4, $3, $2, then they'll be charged $0, $4 (instead of $3), $3 (instead of 2).
 */
export class DetroitCostCalculator extends BuildCostCalculator {
  private readonly freeBuild = injectState(ENGINEER_FREE_BUILD);
  private readonly currentPlayer = injectCurrentPlayer();

  costOf(coordinates: Coordinates, newTileType: TileType): number {
    return this.getBuildDetails(coordinates, newTileType).currentCost;
  }

  registerBuild(coordinates: Coordinates, newTileType: TileType): void {
    const { newCheapestBuild } = this.getBuildDetails(coordinates, newTileType);

    if (newCheapestBuild != null) {
      if (this.freeBuild.isInitialized()) {
        this.freeBuild.set(newCheapestBuild);
      } else {
        this.freeBuild.initState(newCheapestBuild);
      }
    }
  }

  private getBuildDetails(coordinates: Coordinates, newTileType: TileType): { newCheapestBuild?: number, currentCost: number } {
    const cost = super.costOf(coordinates, newTileType);
    if (this.currentPlayer().selectedAction === Action.ENGINEER) {
      if (this.freeBuild.isInitialized()) {
        const previousCost = this.freeBuild();
        if (previousCost < cost) return { currentCost: cost };
        return { currentCost: previousCost, newCheapestBuild: cost };
      } else {
        return { currentCost: 0, newCheapestBuild: cost };
      }
    }
    return { currentCost: cost };
  }
}

export class DetroitBuildAction extends BuildAction {
  process(data: BuildData): boolean {
    const result = super.process(data);
    (this.costCalculator as DetroitCostCalculator).registerBuild(data.coordinates, data.tileType);

    return result;
  }
}