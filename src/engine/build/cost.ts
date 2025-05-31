import { Coordinates } from "../../utils/coordinates";
import { assert, assertNever } from "../../utils/validate";
import { injectGrid } from "../game/state";
import { calculateTrackInfo, countExits, Land, trackEquals } from "../map/location";
import { crosses, isComplexTile, isSimpleTile, isTownTile } from "../map/tile";
import { SpaceType } from "../state/location_type";
import { LandType } from "../state/space";
import { ComplexTileType, Direction, SimpleTileType, TileData, TileType, TownTileType } from "../state/tile";


export class BuildCostCalculator {
  private readonly grid = injectGrid();

  costOf(coordinates: Coordinates, newTileType: TileType, orientation: Direction): number {
    const location = this.grid().get(coordinates);
    assert(location instanceof Land, 'cannot calculate cost of track in non-buildable location');
    const previousTileData = location.getTileData();
    const isFirstTile = previousTileData == null;
    if (isFirstTile) {
      if (isTownTile(newTileType)) {
        return this.getTownTileCost(newTileType);
      }
      return this.getTerrainCost(location) + this.getTileCost(newTileType);
    } else if (location.hasTown()) {
      return this.getTownUpgradeCost();
    } else if (isComplexTile(newTileType) && isSimpleTile(previousTileData.tileType) && crosses(newTileType)) {
      return this.getComplexUpgradeCost(previousTileData.tileType, newTileType);
    } else {
      const redirectCount = countRedirects(previousTileData, newTileType, orientation);
      if (redirectCount > 0) {
        return redirectCount * this.getRedirectCost();
      } else {
        return 2;
      }
    }
  }

  protected getComplexUpgradeCost(_: SimpleTileType, __: ComplexTileType) {
    return 3;
  }

  protected getTownUpgradeCost() {
    return 3;
  }

  protected getRedirectCost() {
    return 2;
  }

  protected getTerrainCost(location: Land): number {
    assert(!location.hasTown());
    return location.getTerrainCost() ?? this.getCostOfLandType(location.getLandType());
  }

  protected getCostOfLandTypeForTown(type: LandType): number {
    switch (type) {
      case SpaceType.MOUNTAIN: return 2;
      case SpaceType.RIVER: return 1;
      case SpaceType.DARK_MOUNTAIN: return 3;
      case SpaceType.RIVER_MOUNTAIN:
      case SpaceType.CRATER: return 1;
      case SpaceType.PLAIN:
      case SpaceType.SWAMP:
      case SpaceType.STREET:
      case SpaceType.LAKE:
      case SpaceType.DESERT:
      case SpaceType.HILL:
      case SpaceType.SKY:
      case SpaceType.FIRE:
        return 0;
      default:
        assert(type !== SpaceType.UNPASSABLE && type !== SpaceType.WATER);
        assertNever(type);
    }
  }

  protected getCostOfLandType(type: LandType): number {
    switch (type) {
      case SpaceType.DARK_MOUNTAIN: return 5;
      case SpaceType.MOUNTAIN: return 4;
      case SpaceType.RIVER_MOUNTAIN: return 5;
      case SpaceType.RIVER: return 3;
      case SpaceType.PLAIN: return 2;
      case SpaceType.SWAMP: return 4;
      case SpaceType.LAKE: return 6;
      case SpaceType.STREET: return 4;
      case SpaceType.HILL: return 3;
      case SpaceType.CRATER: return 3;
      case SpaceType.DESERT: return 3;
      case SpaceType.FIRE: return 3;
      case SpaceType.SKY: return 1;
      default:
        assert(type !== SpaceType.UNPASSABLE && type !== SpaceType.WATER);
        assertNever(type);
    }
  }

  protected getTownTileCost(tileType: TownTileType): number {
    return countExits(tileType) + 1;

  }

  protected getTileCost(tileType: SimpleTileType | ComplexTileType): number {
    if (isSimpleTile(tileType)) {
      return 0;
    }
    if (isComplexTile(tileType)) {
      return crosses(tileType) ? 2 : 1;
    }
    assertNever(tileType);
  }
}

function countRedirects(originalTileData: TileData, newTileType: TileType, newOrientation: Direction) {
  if (isTownTile(originalTileData.tileType) || isTownTile(newTileType)) {
    return 0;
  }

  const previousInfo = calculateTrackInfo(originalTileData);
  const newInfo = calculateTrackInfo({tileType: newTileType, orientation: newOrientation});
  // Every track that no longer has the same exits will be considered redirected.
  // Otherwise, it's not a legal build.
  return previousInfo.filter((trackInfo) => !newInfo.some((newTrackInfo) => trackEquals(trackInfo, newTrackInfo, true))).length;
}