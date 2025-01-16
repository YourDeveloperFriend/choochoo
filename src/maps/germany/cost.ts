import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import {Coordinates} from "../../utils/coordinates";
import {TileType} from "../../engine/state/tile";
import {Action} from "../../engine/state/action";
import {injectCurrentPlayer} from "../../engine/game/state";
import {injectState} from "../../engine/framework/execution_context";
import {BUILD_STATE} from "../../engine/build/state";
import {RAW_BUILD_COSTS} from "./build";

export class GermanyCostCalculator extends BuildCostCalculator {
    protected readonly currentPlayer = injectCurrentPlayer();
    private readonly rawBuildCosts = injectState(RAW_BUILD_COSTS);

    public rawCostOf(coordinates: Coordinates, newTileType: TileType): number {
        return super.costOf(coordinates, newTileType);
    }

    costOf(coordinates: Coordinates, newTileType: TileType): number {
        // Keep track of the raw base costs of bulids in this action
        let baseCost = this.rawCostOf(coordinates, newTileType);
        let oldBuildCosts = this.rawBuildCosts();
        let newBuildCosts = oldBuildCosts.slice();
        newBuildCosts.push(baseCost);

        // If the user doesn't have engineer, just return the base cost
        if (this.currentPlayer().selectedAction !== Action.ENGINEER) {
            return baseCost;
        }

        // Otherwise, calculate the difference between the engineer-adjusted costs as the new cost of this placement.
        let oldTotal = this.engineerCost(oldBuildCosts);
        let newTotal = this.engineerCost(newBuildCosts);
        return newTotal - oldTotal;
    }

    private engineerCost(costs: number[]): number {
        if (costs.length === 0) {
            return 0;
        }
        let maxCost = 0;
        let total = 0;
        for (let cost of costs) {
            total += cost;
            maxCost = Math.max(maxCost, cost);
        }
        return total - Math.floor(maxCost/2);
    }
}
