import { BuildCostCalculator } from "../../engine/build/cost";
import { Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import {
  ComplexTileType,
  Direction,
  SimpleTileType,
  TileType,
} from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";

export class PittsburghFunkyBuilding extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    if (isTownTile(newTileType)) {
      return 0;
    }
    return super.costOf(coordinates, newTileType, orientation);
  }

  protected getTerrainCost(_: Land): number {
    return 0;
  }

  protected getTownUpgradeCost() {
    return 0;
  }

  protected getComplexUpgradeCost(
    oldTileType: SimpleTileType,
    newTileType: ComplexTileType,
  ) {
    if (
      this.getTileCost(oldTileType) !== 10 &&
      this.getTileCost(newTileType) === 10
    ) {
      return 10;
    }
    return super.getComplexUpgradeCost(oldTileType, newTileType);
  }

  protected getTileCost(tileType: SimpleTileType | ComplexTileType): number {
    switch (tileType) {
      case SimpleTileType.STRAIGHT:
      case ComplexTileType.STRAIGHT_TIGHT:
      case ComplexTileType.X:
      case ComplexTileType.BOW_AND_ARROW:
        return 10;

      case SimpleTileType.CURVE:
      case SimpleTileType.TIGHT:
        return 3;

      case ComplexTileType.CROSSING_CURVES:
      case ComplexTileType.COEXISTING_CURVES:
      case ComplexTileType.CURVE_TIGHT_1:
      case ComplexTileType.CURVE_TIGHT_2:
        return 4;
    }
  }
}
