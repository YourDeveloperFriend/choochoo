import { Coordinates } from "../../utils/coordinates";
import { deepEquals } from "../../utils/deep_equals";
import { assertNever } from "../../utils/validate";
import { Good } from "../state/good";
import { LandData, LandType } from "../state/space";
import {
  allDirections,
  allTileTypes,
  ComplexTileType,
  Direction,
  SimpleTileType,
  TileData,
  TileType,
  TownTileType,
} from "../state/tile";
import { rotateDirectionClockwise } from "./direction";
import { Exit, rotateExitClockwise, TOWN, Track, TrackInfo } from "./track";

export function isLand(s: unknown): s is Land {
  return s instanceof Land;
}

export class Land {
  private readonly track: Track[];

  constructor(
    readonly coordinates: Coordinates,
    readonly data: LandData,
  ) {
    this.track = calculateTrackInfo(this.data.tile).map(
      (trackInfo, index) => new Track(index, this.coordinates, trackInfo),
    );
  }

  getTrack(): Track[] {
    return this.track;
  }

  hasTile(): boolean {
    return this.data.tile != null;
  }

  getTerrainCost(): number | undefined {
    return this.data.terrainCost;
  }

  getTileType(): TileType | undefined {
    return this.data.tile?.tileType;
  }

  getTileOrientation(): Direction | undefined {
    return this.data.tile?.orientation;
  }

  getTileData(): TileData | undefined {
    return this.data.tile;
  }

  hasTown(): boolean {
    return this.data.townName != null;
  }

  name(): string | undefined {
    return this.data.townName;
  }

  getGoods(): Good[] {
    return this.data.goods ?? [];
  }

  getLandType(): LandType {
    return this.data.type;
  }

  trackExiting(direction: Direction): Track | undefined {
    return this.getTrack().find((track) => track.hasExit(direction));
  }

  canExit(exit: Direction): boolean {
    return !this.unpassableExits().includes(exit);
  }

  unpassableExits(): Direction[] {
    return this.data.unpassableEdges ?? [];
  }

  getMapSpecific<T>(parser: (t: unknown) => T): T | undefined {
    return this.data.mapSpecific != null
      ? parser(this.data.mapSpecific)
      : undefined;
  }
}

export type MakeOptional<T, Optional extends string> = Pick<
  T,
  Exclude<keyof T, Optional>
> &
  Pick<Partial<T>, keyof T>;

export type BaseTileData = MakeOptional<TileData, "owners">;

export function trackEquals(track1: TrackInfo, track2: TrackInfo): boolean {
  return (
    track1.owner === track2.owner &&
    track1.exits.every((exit) => track2.exits.includes(exit))
  );
}

export function calculateTrackInfo(tileData?: BaseTileData): TrackInfo[] {
  if (!tileData) return [];
  let trackInfo = toBaseTile(tileData.tileType);
  for (
    let dir = Direction.TOP;
    dir !== tileData.orientation;
    dir = rotateDirectionClockwise(dir)
  ) {
    trackInfo = trackInfo.map(rotateTrackInfoClockwise);
  }

  return trackInfo.map((trackInfo, index) => ({
    ...trackInfo,
    owner: tileData.owners?.[index],
    claimableCost: tileData.claimableCost?.[index],
  }));
}

export function rotateTrackInfoClockwise(trackInfo: TrackInfo): TrackInfo {
  return { exits: trackInfo.exits.map(rotateExitClockwise) as [Exit, Exit] };
}

export function usesTownDisc(tile: TownTileType): boolean {
  // If there are 2 or 4 exits, then it requires a town disc.
  return countExits(tile) % 2 === 0;
}

export function countExits(tile: TownTileType): number {
  switch (tile) {
    case TownTileType.LOLLYPOP:
      return 1;

    case TownTileType.STRAIGHT:
    case TownTileType.CURVE:
    case TownTileType.TIGHT:
      return 2;

    case TownTileType.THREE_WAY:
    case TownTileType.LEFT_LEANER:
    case TownTileType.RIGHT_LEANER:
    case TownTileType.TIGHT_THREE:
      return 3;

    case TownTileType.X:
    case TownTileType.CHICKEN_FOOT:
    case TownTileType.K:
      return 4;

    default:
  }
  assertNever(tile);
}

export function calculateTile(trackInfo: TrackInfo[]): TileData {
  for (const tileType of allTileTypes) {
    for (const orientation of allDirections) {
      const newTileData: TileData = {
        tileType,
        orientation,
        owners: trackInfo.map((info) => info.owner),
      };

      if (deepEquals(calculateTrackInfo(newTileData), trackInfo)) {
        return newTileData;
      }
    }
  }
  throw new Error("Cannot find tile for " + trackInfo);
}

export function toBaseTile(tile: TileType): TrackInfo[] {
  const { TOP, BOTTOM, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT } =
    Direction;
  switch (tile) {
    case SimpleTileType.STRAIGHT:
      return [{ exits: [TOP, BOTTOM] }];
    case SimpleTileType.CURVE:
      return [{ exits: [TOP, BOTTOM_LEFT] }];
    case SimpleTileType.TIGHT:
      return [{ exits: [TOP, TOP_LEFT] }];

    // TOWNS
    case TownTileType.LOLLYPOP:
      return [{ exits: [TOWN, TOP] }];
    case TownTileType.STRAIGHT:
      return [{ exits: [TOWN, TOP] }, { exits: [TOWN, BOTTOM] }];
    case TownTileType.CURVE:
      return [{ exits: [TOWN, TOP] }, { exits: [TOWN, BOTTOM_LEFT] }];
    case TownTileType.TIGHT:
      return [{ exits: [TOWN, TOP] }, { exits: [TOWN, TOP_LEFT] }];

    case TownTileType.THREE_WAY:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, BOTTOM_LEFT] },
        { exits: [TOWN, BOTTOM_RIGHT] },
      ];
    case TownTileType.LEFT_LEANER:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, BOTTOM] },
        { exits: [TOWN, TOP_LEFT] },
      ];
    case TownTileType.RIGHT_LEANER:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, BOTTOM] },
        { exits: [TOWN, TOP_RIGHT] },
      ];
    case TownTileType.TIGHT_THREE:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, TOP_LEFT] },
        { exits: [TOWN, TOP_RIGHT] },
      ];

    case TownTileType.X:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, BOTTOM] },
        { exits: [TOWN, TOP_RIGHT] },
        { exits: [TOWN, BOTTOM_LEFT] },
      ];

    case TownTileType.CHICKEN_FOOT:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, BOTTOM] },
        { exits: [TOWN, BOTTOM_RIGHT] },
        { exits: [TOWN, BOTTOM_LEFT] },
      ];

    case TownTileType.K:
      return [
        { exits: [TOWN, TOP] },
        { exits: [TOWN, TOP_RIGHT] },
        { exits: [TOWN, BOTTOM_RIGHT] },
        { exits: [TOWN, BOTTOM] },
      ];

    // COMPLEX CROSSING
    case ComplexTileType.X:
      return [
        { exits: [TOP_LEFT, BOTTOM_RIGHT] },
        { exits: [BOTTOM_LEFT, TOP_RIGHT] },
      ];
    case ComplexTileType.BOW_AND_ARROW:
      return [{ exits: [BOTTOM_LEFT, BOTTOM_RIGHT] }, { exits: [BOTTOM, TOP] }];
    case ComplexTileType.CROSSING_CURVES:
      return [{ exits: [TOP_LEFT, BOTTOM] }, { exits: [BOTTOM_LEFT, TOP] }];

    // COMPLEX COEXISTING
    case ComplexTileType.STRAIGHT_TIGHT:
      return [{ exits: [TOP, BOTTOM] }, { exits: [BOTTOM_LEFT, TOP_LEFT] }];
    case ComplexTileType.COEXISTING_CURVES:
      return [{ exits: [TOP_LEFT, BOTTOM] }, { exits: [TOP, BOTTOM_RIGHT] }];
    case ComplexTileType.CURVE_TIGHT_1:
      return [
        { exits: [TOP, BOTTOM_RIGHT] },
        { exits: [TOP_LEFT, BOTTOM_LEFT] },
      ];
    case ComplexTileType.CURVE_TIGHT_2:
      return [{ exits: [TOP, BOTTOM_RIGHT] }, { exits: [BOTTOM_LEFT, BOTTOM] }];

    default:
  }
  assertNever(tile);
}
