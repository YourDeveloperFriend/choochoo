import { BuildCostCalculator } from "../../engine/build/cost";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { Coordinates } from "../../utils/coordinates";
import { Direction, TileType } from "../../engine/state/tile";

export class VermontBuildCostCalculator extends BuildCostCalculator {
  private readonly currentRound = injectState(ROUND);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const baseCost = super.costOf(coordinates, newTileType, orientation);
    if (this.currentRound() % 2 === 1) {
      return baseCost + 1;
    }
    return baseCost;
  }
}
