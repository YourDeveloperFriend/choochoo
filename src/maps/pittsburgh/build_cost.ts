import { Map } from "immutable";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import {
  ComplexTileType,
  Direction,
  SimpleTileType,
  TileType,
} from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";

export class PittsburghBuilderHelper extends BuilderHelper {
  protected minimumBuildCost(): number {
    return 0;
  }

  protected startingManifest(): Map<TileType, number> {
    return super.startingManifest().delete(ComplexTileType.X);
  }
}

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

  protected getRedirectCost(previousTileType: TileType, newTileType: TileType): number {
    // Pittsburgh rules on the cost of redirecting is very particular based on the prior tile type and the new one
    // In particular, redirecting a simple tile to another simple is still always just $4. *shrug*
    if ((previousTileType === ComplexTileType.CURVE_TIGHT_1
        || previousTileType === ComplexTileType.CURVE_TIGHT_2
        || previousTileType === ComplexTileType.CROSSING_CURVES) && newTileType === ComplexTileType.BOW_AND_ARROW) {
      return 10;
    }
    if ((previousTileType === ComplexTileType.CURVE_TIGHT_1
        || previousTileType === ComplexTileType.CURVE_TIGHT_2) && newTileType === ComplexTileType.STRAIGHT_TIGHT) {
      return 10;
    }

    return 4;
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
    return 4;
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
