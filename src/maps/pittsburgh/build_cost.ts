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

/**
 * NOTE: track-costing logic for this map is split across two locations,
 * and both need to be checked when reasoning about or modifying costs:
 *
 *   1. costOf() (override)         — entry point; delegates to overrideCost()
 *      and falls back to super.costOf() when overrideCost() returns undefined.
 *   2. overrideCost() (this class) — custom pricing rules specific
 *      to this map (first-tile complex pricing, simple->complex transitions,
 *      complex->complex redirects). Returns undefined for any case it
 *      doesn't own, deferring to super.
 *
 * KNOWN ISSUE (as of 2026-07-18): overrideCost() currently has two
 * paths that both defer to super (the isSimpleToSimple guard,
 * and the fallthrough at the bottom of the function), and not yet
 * confirmed whether these represent the same underlying case or two
 * genuinely different ones. Needs a pass to verify before relying on this
 * structure further.
 */ 
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

  private overrideCost(
    previousTileData: TileData | undefined,
    newTileType: TileType
  ) : number | undefined {
    // fallback to superclass/overrides in these cases
    const isFirstTile = previousTileData == null;
    if (isFirstTile) {
      return undefined;
    }
    if (
      isTownTile(previousTileData.tileType) ||
      isTownTile(newTileType)
    ) {
      return undefined;
    }
    if (this.isSimpleToSimple(previousTileData.tileType, newTileType)) {
      return undefined;
    }

    if (isComplexTile(newTileType)) {
      return this.costForComplexUpgrade(
        this.containsStraight(previousTileData.tileType),
        this.containsStraight(newTileType)
      );
    }

    return undefined;
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
    if (!this.containsStraight(newTileType)) {
      return 3;
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

  private costForComplexUpgrade(
    previousTileStraight: boolean,
    newTileStraight: boolean
  ): number | undefined {
    if (!previousTileStraight && !newTileStraight) return 4;
    if (!previousTileStraight && newTileStraight) return 10;
    if (previousTileStraight && !newTileStraight) return 4;

    // straightBefore && straightAfter
    return undefined;
  }

  private isSimpleToSimple(previousTileType: TileType, newTileType: TileType): boolean {
    return isSimpleTile(newTileType) &&
      isSimpleTile(previousTileType);
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