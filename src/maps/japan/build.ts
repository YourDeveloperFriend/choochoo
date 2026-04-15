import { JapanMapData } from "./grid";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { Coordinates } from "../../utils/coordinates";
import {
  calculateTrackInfo,
  Land,
  partitionTracks,
} from "../../engine/map/location";
import { Exit, TOWN } from "../../engine/map/track";
import { BuildCostCalculator } from "../../engine/build/cost";
import { Direction, SimpleTileType, TileType } from "../../engine/state/tile";
import {
  rotateDirectionClockwise,
  rotateDirectionCounterClockwise,
} from "../../engine/map/direction";
import { Grid } from "../../engine/map/grid";

export class JapanBuildCostCalculator extends BuildCostCalculator {
  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    const space = this.grid().get(coordinates);
    if (space instanceof Land) {
      const mapSpecific = space.getMapSpecific(JapanMapData.parse);
      if (mapSpecific !== undefined && mapSpecific.waterCrossing) {
        return 6;
      }
      if (
        mapSpecific !== undefined &&
        mapSpecific.halfWaterSide !== undefined
      ) {
        const halfWaterSide = mapSpecific.halfWaterSide;
        const newTileData = calculateTrackInfo({
          tileType: newTileType,
          orientation: orientation,
        });
        const { newTracks } = partitionTracks(space, newTileData);
        if (
          newTracks
            .map((newTrack) =>
              getHalfHexTrackType(halfWaterSide, newTrack.exits),
            )
            .some((type) => type === HalfHexTrackType.WATER_CROSSING)
        ) {
          return 6;
        }
        return 3;
      }
    }
    return super.costOf(coordinates, newTileType, orientation);
  }
}

export class JapanBuildValidator extends Validator {
  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason !== undefined) {
      return reason;
    }

    const grid = this.grid();
    const space = grid.get(coordinates);
    if (space instanceof Land) {
      const mapSpecific = space.getMapSpecific(JapanMapData.parse);
      if (mapSpecific !== undefined && mapSpecific.waterCrossing) {
        if (buildData.tileType === SimpleTileType.TIGHT) {
          return "Cannot build tight curve on water hexes.";
        }
        const trackInfo = calculateTrackInfo(buildData);
        if (trackInfo.length > 1) {
          return "Can only build simple track on water crossing spaces.";
        }
        if (trackInfo.length !== 0) {
          for (const exit of trackInfo[0].exits) {
            if (exit === TOWN) {
              return "Cannot build town tiles on water crossing spaces.";
            }
            if (!isNeighborLand(grid, coordinates, exit)) {
              return "Both ends of water crossings must attach to land.";
            }
          }
        }
      }
      if (
        mapSpecific !== undefined &&
        mapSpecific.halfWaterSide !== undefined
      ) {
        const newTileData = calculateTrackInfo(buildData);
        const { rerouted, newTracks } = partitionTracks(space, newTileData);
        if (newTracks.length > 1) {
          return "Cannot do direct builds of complex track on half-water hexes.";
        }
        if (rerouted.length > 0) {
          return "Cannot redirect track on half-water hexes.";
        }
        if (newTracks.length > 0) {
          const newTrack = newTracks[0];
          const type = getHalfHexTrackType(
            mapSpecific.halfWaterSide,
            newTrack.exits,
          );
          if (type === HalfHexTrackType.INVALID) {
            return "At least one side of track on half-water hexes must be on land.";
          }

          for (const exit of newTrack.exits) {
            if (
              exit !== TOWN &&
              isWaterEdge(mapSpecific.halfWaterSide, exit) &&
              !isNeighborLand(grid, coordinates, exit)
            ) {
              return "Water end of half-water hex must attach to land.";
            }
          }
        }
      }
    }
  }
}

enum HalfHexTrackType {
  INVALID = 1,
  LAND_ONLY = 2,
  WATER_CROSSING = 3,
}

function getHalfHexTrackType(
  halfWaterSide: Direction,
  exits: [Exit, Exit],
): HalfHexTrackType {
  if (exits[0] === TOWN || exits[1] === TOWN) {
    return HalfHexTrackType.INVALID;
  }
  if (isLandEdge(halfWaterSide, exits[0])) {
    if (isLandEdge(halfWaterSide, exits[1])) {
      return HalfHexTrackType.LAND_ONLY;
    }
    return HalfHexTrackType.WATER_CROSSING;
  } else {
    if (isLandEdge(halfWaterSide, exits[1])) {
      return HalfHexTrackType.WATER_CROSSING;
    }
    return HalfHexTrackType.INVALID;
  }
}

function isWaterEdge(halfWaterSide: Direction, side: Direction) {
  if (
    side === halfWaterSide ||
    side === rotateDirectionClockwise(halfWaterSide) ||
    side === rotateDirectionCounterClockwise(halfWaterSide)
  ) {
    return true;
  }
  return false;
}
function isLandEdge(halfWaterSide: Direction, side: Direction) {
  return !isWaterEdge(halfWaterSide, side);
}
function isNeighborLand(
  grid: Grid,
  coordinates: Coordinates,
  direction: Direction,
): boolean {
  const neighbor = grid.getNeighbor(coordinates, direction);
  if (neighbor === undefined) {
    return false;
  }
  const neighborMapSpecific = neighbor.getMapSpecific(JapanMapData.parse);
  if (neighborMapSpecific !== undefined && neighborMapSpecific.waterCrossing) {
    return false;
  }
  return true;
}
