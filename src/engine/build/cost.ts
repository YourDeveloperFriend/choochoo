import { Coordinates } from "../../utils/coordinates";
import { assert, assertNever } from "../../utils/validate";
import { injectGrid } from "../game/state";
import { countExits, Land } from "../map/location";
import { crosses, isComplexTile, isSimpleTile, isTownTile } from "../map/tile";
import { SpaceType } from "../state/location_type";
import { LandType } from "../state/space";
import { ComplexTileType, SimpleTileType, TileType, TownTileType } from "../state/tile";


export class BuildCostCalculator {
  private readonly grid = injectGrid();

  costOf(coordinates: Coordinates, newTileType: TileType): number {
    const location = this.grid().get(coordinates);
    assert(location instanceof Land, 'cannot calculate cost of track in non-buildable location');
    const previousTileType = location.getTileType();
    const isReplacingTile = previousTileType != null;
    if (!isReplacingTile) {
      if (isTownTile(newTileType)) {
        return this.getTownTileCost(newTileType);
      }
      return this.getTerrainCost(location) + this.getTileCost(newTileType);
    } else if (location.hasTown()) {
      return 3;
    } else if (isComplexTile(newTileType) && isSimpleTile(previousTileType) && crosses(newTileType)) {
      return 3;
    } else {
      return 2;
    }
  }

  protected getTerrainCost(location: Land): number {
    assert(!location.hasTown());
    return location.getTerrainCost() ?? this.getCostOfLandType(location.getLandType());
  }

  protected getCostOfLandType(type: LandType): number {
    switch (type) {
      case SpaceType.MOUNTAIN: return 4;
      case SpaceType.RIVER: return 3;
      case SpaceType.PLAIN: return 2;
      case SpaceType.SWAMP: return 4;
      case SpaceType.LAKE: return 6;
      case SpaceType.STREET: return 4;
      case SpaceType.HILL: return 3;
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