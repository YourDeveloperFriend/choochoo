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
  TownTileType
} from "../../engine/state/tile";
import { LandType } from "../../engine/state/space";
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

// 
// NOTE: track-cost logic is split between the engine's native costOf() function
// and our custom override to accomodate Pittsburgh's costing peculiarities.
// 
// Cases handled by super's costOf():
//   - is first tile placed in a hex (town, simple, or complex)
//   - is a town->town upgrade
//   - is a simple->simple redirect
//   - simple->complex and complex->complex upgrades where 
//       straight-before-and-after track is involved
// 
// Cases handled by overridden costOf():
//   - simple->complex and complex->complex upgrades (excluding 
//       cases where straight-before-and-after track are involved)
// 
// KNOWN BUG: Simple->complex and complex->complex upgrades are not costed properly
// in cases where straight-before-and-after track are involved. They fallback to
// engine's native costOf() fuction, where cost is based on number of redirects.
// Bug not addressed in this PR.
// 
export class PittsburghFunkyBuilding extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const location = this.grid().get(coordinates);
    assert(location instanceof Land, 'cannot calculate cost of track in non-buildable location');
    const previousTileData = location.getTileData();

    const overriddenCost = this.overrideCost(previousTileData, newTileType);
    return overriddenCost ?? super.costOf(coordinates, newTileType, orientation);
  }

  private overrideCost(
    previousTileData: TileData | undefined,
    newTileType: TileType
  ) : number | undefined {
    const isFirstTile = previousTileData == null;
    if (isFirstTile) {
      // Defers first tile pricing to super
      return undefined;
    }
    if (
      isTownTile(previousTileData.tileType) ||
      isTownTile(newTileType)
    ) {
      // Defers town tile upgrade pricing to super
      return undefined;
    }
    if (
      isSimpleTile(previousTileData.tileType) &&
      isSimpleTile(newTileType)
    ) {
      // Defers simple tile redirect pricing to super
      return undefined;
    }

    // Checking for simple->complex or complex->complex tile upgrades.
    if (isComplexTile(newTileType)) {
      return this.costForComplexUpgrade(
        this.containsStraight(previousTileData.tileType),
        this.containsStraight(newTileType)
      );
    }

    // Defers to engine to handle impossible track upgrades
    // (ie complex->simple upgrade)
    return undefined;
  }

  // Currently receives BOTH (simple->simple redirects) AND (simple->complex and
  // complex->complex cases from overrideCost()).
  // Once that's fixed to handle complex cases itself, this function should go back
  // to simple->simple only.
  // This exists to preserve existing erroneous costs.
  protected getRedirectCost(
    previousTileType: TileType,
    newTileType: TileType,
  ): number {
    assert(!isTownTile(previousTileType));
    assert(!isTownTile(newTileType));
    // Can be removed once straight-before-and-after complex-upgrade cost bug is resolved.
    if (
      this.containsStraight(previousTileType) &&
      this.containsStraight(newTileType)
    ) {
      return 4;
    }

    // https://boardgamegeek.com/thread/250037/article/1900582#1900582
    return this.containsStraight(newTileType) ? 10 : 3;
  }

  // Can be removed once straight-before-and-after complex-upgrade cost bug is resolved.
  // Necessary to preserve existing costs.
  protected getComplexUpgradeCost(
    _: SimpleTileType,
    __: ComplexTileType
  ) {
    return 4;
  }

  protected getTerrainCost(_: Land): number {
    return 0;
  }

  protected getTownUpgradeCost() {
    return 0;
  }

  protected getTownTileCost(_: TownTileType): number {
    return 0;
  }

  protected getCostOfLandTypeForTown(_: LandType): number {
    return 0;
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

  private costForComplexUpgrade(
    previousTileStraight: boolean,
    newTileStraight: boolean
  ): number | undefined {
    if (!previousTileStraight && !newTileStraight) { 
      return 4;
    }
    if (!previousTileStraight && newTileStraight) {
      return 10;
    }
    if (previousTileStraight && !newTileStraight) {
      return 4;
    }

    // previousTileStraight && newTileStraight
    // Straight-before-and-after complex-upgrade cost bug can be resolved here
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