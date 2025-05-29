import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { TOWN, Track } from "../../engine/map/track";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor } from "../../engine/state/player";
import { Direction, TileData, TownTileType } from "../../engine/state/tile";
import { assert } from "../../utils/validate";

export class HeavyCardboardClaimAction extends ClaimAction {
  validate(data: ClaimData): void {
    super.validate(data);
    const land = this.grid().get(data.coordinates) as Land;
    const track = land.getTrack().find((track) => track.isClaimable())!;
    assert(canClaim(this.grid(), track, this.currentPlayerColor()), {
      invalidInput:
        "cannot claim track without urbanizing or building to the town",
    });
  }

  process(data: ClaimData): boolean {
    // Madeira has a weird rule set where claiming the track creates a track
    // to the connected town.
    // See https://boardgamegeek.com/thread/3491329/how-do-you-build-the-ferry-to-madeira
    const topLeft = this.grid().get(
      data.coordinates.neighbor(Direction.TOP_LEFT),
    );
    const topRight = this.grid().get(
      data.coordinates.neighbor(Direction.TOP_RIGHT),
    );
    if (topLeft instanceof Land) {
      this.placeTrack(topLeft, Direction.TOP_LEFT);
    } else if (topRight instanceof Land) {
      this.placeTrack(topRight, Direction.TOP_RIGHT);
    }

    return super.process(data);
  }

  private placeTrack(land: Land, direction: Direction): void {
    this.gridHelper.update(land.coordinates, (spaceData) => {
      assert(spaceData.type !== SpaceType.CITY);
      spaceData.tile = this.getTileData(spaceData.tile!, direction);
    });
  }

  private getTileData(tileData: TileData, direction: Direction): TileData {
    if (tileData.tileType === TownTileType.TIGHT) {
      return {
        tileType: TownTileType.TIGHT_THREE,
        orientation: Direction.BOTTOM,
        owners: [this.currentPlayerColor(), ...tileData.owners.reverse()],
      };
    } else if (tileData.orientation === Direction.BOTTOM) {
      return {
        tileType: TownTileType.TIGHT,
        orientation:
          direction == Direction.TOP_LEFT
            ? Direction.BOTTOM
            : Direction.BOTTOM_LEFT,
        owners: [tileData.owners[0], this.currentPlayerColor()],
      };
    } else {
      return {
        tileType: TownTileType.CURVE,
        orientation: Direction.BOTTOM_LEFT,
        owners: [tileData.owners[0], this.currentPlayerColor()],
      };
    }
  }
}

function canClaim(grid: Grid, track: Track, owner: PlayerColor) {
  return track.getExits().every((exit) => {
    if (exit === TOWN) return false;
    const neighbor = grid.get(track.coordinates.neighbor(exit));
    if (neighbor == null) return false;
    if (neighbor instanceof City) return true;
    return neighbor.getTrack().some((track) => track.getOwner() === owner);
  });
}
