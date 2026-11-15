/** Methods in this file reverse-engineer the logic in {calculateTrackInfo} */

import { rotateDirectionClockwise } from "../engine/map/direction";
import { toBaseTile } from "../engine/map/location";
import { PlayerColor } from "../engine/state/player";
import {
  Direction,
  MutableTileData,
  SimpleTileType,
  TownTileType,
} from "../engine/state/tile";
import { ImmutableSet } from "../utils/immutable";
import { fail } from "../utils/validate";

export function startFrom(startFrom: Direction): TrackFactory {
  return new TrackFactory(startFrom);
}

// eslint-disable-next-line
function townTile(
  directions: Direction[],
  owners: Array<PlayerColor | undefined>,
): MutableTileData {
  const options = [
    TownTileType.LOLLYPOP,
    TownTileType.STRAIGHT,
    TownTileType.CURVE,
    TownTileType.TIGHT,
    TownTileType.THREE_WAY,
    TownTileType.LEFT_LEANER,
    TownTileType.RIGHT_LEANER,
    TownTileType.TIGHT_THREE,
    TownTileType.X,
    TownTileType.CHICKEN_FOOT,
    TownTileType.K,
  ];
  for (const tileType of options) {
    let tileDirections = toBaseTile(tileType).map(
      (tile) => tile.exits[1] as Direction,
    );
    if (tileDirections.length === directions.length) {
      continue;
    }
    let orientation = Direction.TOP;
    for (let i = 0; i < 6; i++) {
      if (ImmutableSet(tileDirections).subtract(directions).isEmpty()) {
        const newOwners = tileDirections.map((dir) => {
          const index = directions.indexOf(dir);
          return owners[index];
        });
        return {
          tileType,
          orientation,
          owners: newOwners,
        };
      }
      tileDirections = tileDirections.map(rotateDirectionClockwise);
      orientation = rotateDirectionClockwise(orientation);
    }
  }
  fail(`found no track with exits ${directions.join(",")}`);
}

class TrackFactory {
  constructor(private readonly startFrom: Direction) {}

  straightAcross(owner?: PlayerColor): MutableTileData {
    return {
      tileType: SimpleTileType.STRAIGHT,
      orientation: this.startFrom,
      owners: [owner],
    };
  }

  curveLeft(owner?: PlayerColor): MutableTileData {
    return {
      tileType: SimpleTileType.CURVE,
      orientation: rotateDirectionClockwise(
        rotateDirectionClockwise(this.startFrom),
      ),
      owners: [owner],
    };
  }

  curveRight(owner?: PlayerColor): MutableTileData {
    return {
      tileType: SimpleTileType.CURVE,
      orientation: this.startFrom,
      owners: [owner],
    };
  }

  tightLeft(owner?: PlayerColor): MutableTileData {
    return {
      tileType: SimpleTileType.TIGHT,
      orientation: rotateDirectionClockwise(this.startFrom),
      owners: [owner],
    };
  }

  tightRight(owner?: PlayerColor): MutableTileData {
    return {
      tileType: SimpleTileType.TIGHT,
      orientation: this.startFrom,
      owners: [owner],
    };
  }
}
