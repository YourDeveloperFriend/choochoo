import { BuildCostCalculator } from "../../engine/build/cost";
import { Coordinates } from "../../utils/coordinates";
import { Direction, TileType } from "../../engine/state/tile";

export class UnionPacificExpressBuildCostCalculator extends BuildCostCalculator {
  costOf(
    _coordinates: Coordinates,
    _newTileType: TileType,
    _orientation: Direction,
  ): number {
    return 3;
  }
}
