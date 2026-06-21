import { Coordinates } from "../../utils/coordinates";
import { injectState } from "../../engine/framework/execution_context";
import { injectCurrentPlayer, TURN_ORDER } from "../../engine/game/state";
import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import { Direction, TileType } from "../../engine/state/tile";

export class StalinistRussiaBuildCostCalculator extends BuildCostCalculator {
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly turnOrder = injectState(TURN_ORDER);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    let cost = super.costOf(coordinates, newTileType, orientation);
    // The player who is last in turn order (who received Stalin's disfavor this
    // round) pays $1 extra per tile lay during the build phase.
    const order = this.turnOrder();
    if (
      order.length > 0 &&
      order[order.length - 1] === this.currentPlayer().color
    ) {
      cost += 1;
    }
    return cost;
  }

  protected getCostOfLandTypeForTown(type: LandType): number {
    // Towns with rivers cost an extra $1 on top of the usual cost.
    if (type === SpaceType.RIVER) {
      return super.getCostOfLandTypeForTown(type) + 1;
    }
    return super.getCostOfLandTypeForTown(type);
  }
}
