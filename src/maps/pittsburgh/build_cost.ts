import { Map } from "immutable";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { Land } from "../../engine/map/location";
import {
  isTownTile,
  isComplexTile,
  isSimpleTile,
} from "../../engine/map/tile";
import {
  ComplexTileType,
  Direction,
  SimpleTileType,
  TileData,
  TileType,
} from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert, assertNever } from "../../utils/validate";

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
    const location = this.grid().get(coordinates);
    assert(location instanceof Land, 'cannot calculate cost of track in non-buildable location');
    const previousTileData = location.getTileData();

    const overrideCost = this.overrideCost(previousTileData, newTileType);
    return overrideCost ?? super.costOf(coordinates, newTileType, orientation);
  }

  protected getRedirectCost(
    previousTileType: TileType,
    newTileType: TileType,
  ): number {
    assert(!isTownTile(previousTileType));
    assert(!isTownTile(newTileType));
    // https://boardgamegeek.com/thread/250037/article/1900582#1900582
    if (
      !this.containsStraight(previousTileType) &&
      this.containsStraight(newTileType)
    ) {
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
    _: SimpleTileType,
    __: ComplexTileType,
  ) {
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

  private overrideCost(
    previousTileData: TileData | undefined,
    newTileType: TileType
  ) : number | undefined {
    if (isTownTile(newTileType)) {
      return 0;
    }
    if (previousTileData == null) {
      return undefined;
    }
    if (
      isComplexTile(newTileType) &&
      isSimpleTile(previousTileData.tileType) &&
      !this.containsStraight(previousTileData.tileType) &&
      this.containsStraight(newTileType)
    ) {
      return 10;
    }
    return undefined;
  }

  private containsStraight(tileType: SimpleTileType  | ComplexTileType ): boolean {
    switch (tileType) {
        // CONTAINS STRAIGHT TRACK
        case SimpleTileType.STRAIGHT:
        case ComplexTileType.X:
        case ComplexTileType.BOW_AND_ARROW:
        case ComplexTileType.STRAIGHT_TIGHT:
          return true;

        // CONTAINS NO STRAIGHT TRACK
        case SimpleTileType.CURVE:
        case SimpleTileType.TIGHT:
        case ComplexTileType.CROSSING_CURVES:
        case ComplexTileType.COEXISTING_CURVES:
        case ComplexTileType.CURVE_TIGHT_1:
        case ComplexTileType.CURVE_TIGHT_2:
          return false;
        default:
          assertNever(tileType);
    }
  }
}