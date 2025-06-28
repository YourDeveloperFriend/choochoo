import { BuildCostCalculator } from "../../engine/build/cost";
import { Direction, TileType } from "../../engine/state/tile";
import { countExits, Land } from "../../engine/map/location";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { isTownTile } from "../../engine/map/tile";

export class DenmarkBuildCostCalculator extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const location = this.grid().get(coordinates);
    assert(
      location instanceof Land,
      "cannot calculate cost of track in non-buildable location",
    );
    const previousTileData = location.getTileData();
    const isFirstTile = previousTileData == null;
    if (isFirstTile) {
      if (isTownTile(newTileType)) {
        return (
          this.getCostOfLandType(location.getLandType()) +
          countExits(newTileType)
        );
      }
    } else {
      // All upgrades cost $3
      return 3;
    }

    // Other than upgrades and town costs, everything else is standard
    return super.costOf(coordinates, newTileType, orientation);
  }
}
