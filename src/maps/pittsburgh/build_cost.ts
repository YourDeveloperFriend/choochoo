import { Map } from "immutable";
import { BuildCostCalculator, countRedirects } from "../../engine/build/cost";
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
export class PittsburghFunkyBuilding extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const location = this.grid().get(coordinates);
    assert(location instanceof Land, 'cannot calculate cost of track in non-buildable location');
    const previousTileData = location.getTileData();

    if (!this.isComplexUpgrade(previousTileData, newTileType)) {
      return super.costOf(coordinates, newTileType, orientation);
    }

    assert(!isTownTile(previousTileData.tileType));
    assert(!isTownTile(newTileType));
    const previousTileContainsStraight = this.containsStraight(previousTileData.tileType);
    const newTileContainsStraight = this.containsStraight(newTileType);
    if (!(previousTileContainsStraight && newTileContainsStraight)) {
      return this.costForUnambiguousUpgrade(previousTileContainsStraight, newTileContainsStraight);
    }

    const isPreviousTileSimple = isSimpleTile(previousTileData.tileType);
    const redirects = countRedirects(previousTileData, newTileType, orientation);
    return this.costForAmbiguousUpgrade(isPreviousTileSimple, redirects);
  }

  private costForAmbiguousUpgrade(
    isPreviousTileSimple: boolean,
    redirects: number
  ): number {
    const tileComplexity = isPreviousTileSimple ? "simple" : "complex";
    if (isPreviousTileSimple) {
      switch(redirects) {
        case 0: 
          return 4;
        case 1:
          return 10;
        default:
          assert(false, {
            invalidInput: `unsupported number of redirects ${redirects} for ${tileComplexity} track`,
          });
      }
    }
    switch(redirects) {
      case 0:
      case 1: 
        return 4;
      case 2:
        return 10;
      default:
        assert(false, {
          invalidInput: `unsupported number of redirects ${redirects} for ${tileComplexity} track`,
        });
    }
  }

  private costForUnambiguousUpgrade(
    previousTileContainsStraight: boolean,
    newTileContainsStraight: boolean
  ): number {
    const containsNoStraight = !previousTileContainsStraight && !newTileContainsStraight;
    if (containsNoStraight) { 
      return 4;
    }
    const removedStraight = previousTileContainsStraight && !newTileContainsStraight;
    if (removedStraight) {
      return 4;
    }
    const introducedStraight = !previousTileContainsStraight && newTileContainsStraight;
    if (introducedStraight) {
      return 10;
    }
    assert(false, {
      invalidInput: "this function will not accept straight->straight upgrades (aka ambiguous upgrades)"
    });
  }

  private isComplexUpgrade(
    previousTileData: TileData | undefined,
    newTileType: TileType
  ): previousTileData is TileData {
    const isFirstTile = previousTileData == null;
    if (isFirstTile) {
      return false;
    }
    const isTownUpgrade = isTownTile(previousTileData.tileType) && isTownTile(newTileType)
    if (isTownUpgrade) {
      return false;
    }
    const isSimpleRedirect = isSimpleTile(previousTileData.tileType) && isSimpleTile(newTileType)
    if (isSimpleRedirect) {
      return false;
    }
    const isComplexToSimpleRedirect = isComplexTile(previousTileData.tileType) && isSimpleTile(newTileType)
    if (isComplexToSimpleRedirect) {
      return false;
    }

    return true;
  }

  protected getRedirectCost(
    previousTileType: TileType,
    newTileType: TileType,
  ): number {
    assert(!isTownTile(previousTileType));
    assert(!isTownTile(newTileType));

    // https://boardgamegeek.com/thread/250037/article/1900582#1900582
    return this.containsStraight(newTileType) ? 10 : 3;
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
