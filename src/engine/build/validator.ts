import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { injectGrid } from "../game/state";
import { City } from "../map/city";
import { getOpposite } from "../map/direction";
import { Grid } from "../map/grid";
import { calculateTrackInfo, Land, usesTownDisc } from "../map/location";
import { isTownTile } from "../map/tile";
import { Exit, TOWN, Track, TrackInfo } from "../map/track";
import { PlayerColor } from "../state/player";
import { Direction, TileType } from "../state/tile";
import { BuilderHelper } from "./helper";


export interface BuildInfo {
  tileType: TileType;
  orientation: Direction;
  playerColor: PlayerColor;
}

export type InvalidBuildReason = string;

export class Validator {
  protected readonly helper = inject(BuilderHelper);
  protected readonly grid = injectGrid();

  tileMatchesTownType(coordinates: Coordinates, tileType: TileType): InvalidBuildReason | undefined {
    const space = this.grid().get(coordinates);
    assert(space !== undefined);
    if (space instanceof City) {
      return 'cannot place track on a city';
    }

    const thisIsTownTile = isTownTile(tileType);
    if (space.hasTown() !== thisIsTownTile) {
      if (thisIsTownTile) {
        return 'cannot place town track on a non-town tile';
      }
      return 'cannot place regular track on a town tile';
    }
  }

  /** Returns the invalid build reason. The order matters here, because we can show a specific error if every single build option returns that error. */
  getInvalidBuildReason(coordinates: Coordinates, buildData: BuildInfo): InvalidBuildReason | undefined {
    const grid = this.grid();
    const space = grid.get(coordinates);
    if (space instanceof City) {
      return 'cannot build on a city';
    }
    if (space == null || space.isUnpassable()) {
      return 'cannot build on unpassable terrain';
    }

    const newTileData = calculateTrackInfo(buildData);

    const { preserved, rerouted, newTracks } = this.partitionTracks(space, newTileData);

    // Don't validate unmodified track because those are owned by other players.
    const trackToValidate = newTracks.concat(rerouted);

    if (!this.newTrackExtendsPrevious(buildData.playerColor, space, trackToValidate)) {
      return 'new track must come off a city or extend previous track';
    }

    if (!this.helper.tileAvailableInManifest(buildData.tileType)) {
      return 'tile unavailable';
    }
    

    const townTileError = this.tileMatchesTownType(space.coordinates, buildData.tileType);
    if (townTileError != null) {
      return townTileError;
    }

    const thisIsTownTile = isTownTile(buildData.tileType);

    if (thisIsTownTile && rerouted.length > 0) {
      return 'cannot reroute track on a town tile';
    }

    for (const reroutedTrack of rerouted) {
      const oldTrack = this.oldTrack(space, reroutedTrack)!;
      const oldOwner = oldTrack.getOwner();
      if (oldOwner != null && oldOwner !== buildData.playerColor) {
        return `cannot reroute another player's track`;
      }

      if (!this.grid().dangles(oldTrack)) {
        return 'cannot change non-dangling track';
      }
    }

    for (const track of [...newTracks, ...rerouted]) {
      for (const exit of track.exits) {
        if (exit === TOWN) continue;
        const reason = this.connectionAllowed(buildData.playerColor, space, exit);
        if (reason) {
          return reason;
        }
      }
    }

    if (rerouted.length + newTracks.length === 0) {
      return 'must build or reroute track';
    }

    // Look to see if any track was removed
    if (preserved.length + rerouted.length !== space.getTrack().length) {
      return 'must preserve previous track';
    }

    if (this.newTrackConnectsToAnotherPlayer(buildData.playerColor, space, trackToValidate)) {
      return 'new track cannot connect to another player\'s track';
    }

    if (this.createsCircularLoop(grid, coordinates, trackToValidate)) {
      return 'cannot create a loop back to the same location';
    }

    const townDiscCount = this.townDiscCount();
    if (this.exceedsTownDiscCount(grid, townDiscCount, coordinates, buildData)) {
      return `cannot use more than ${townDiscCount} town discs`;
    }
  }

  protected connectionAllowed(playerColor: PlayerColor, land: Land, exit: Direction): InvalidBuildReason|undefined {
    const neighbor = this.grid().getNeighbor(land.coordinates, exit);
    if (!land.connectionAllowed(exit, neighbor)) {
      return 'cannot build towards an unpassable edge';
    }
    return undefined;
  }

  protected exceedsTownDiscCount(grid: Grid, townDiscCount: number, coordinates: Coordinates, buildData: BuildInfo): boolean {
    const requiresTownDisc = isTownTile(buildData.tileType) && usesTownDisc(buildData.tileType);

    const currentTile = (grid.get(coordinates) as Land).getTileType();
    const oldVersionRequiredTownDisc = currentTile != null && isTownTile(currentTile) && usesTownDisc(currentTile);

    const atTownDiscLimit = grid.countTownDiscs() === townDiscCount;
    return requiresTownDisc && !oldVersionRequiredTownDisc && atTownDiscLimit;
  }

  protected townDiscCount(): number {
    return 8;
  }

  private createsCircularLoop(grid: Grid, coordinates: Coordinates, newTileData: TrackInfo[]): boolean {
    return newTileData.some((track) => {
      const [firstExit, secondExit] = track.exits;
      const [firstCoordinates, firstEndExit] = this.getEnd(coordinates, firstExit);
      const [secondCoordinates, secondEndExit] = this.getEnd(coordinates, secondExit);
      if (firstEndExit === TOWN) {
        return secondEndExit === TOWN && firstCoordinates.equals(secondCoordinates);
      }
      if (secondEndExit === TOWN) {
        return false;
      }
      const first = grid.get(firstCoordinates.neighbor(firstEndExit))!;
      const second = grid.get(secondCoordinates.neighbor(secondEndExit))!;
      if (first instanceof City && second instanceof City) {
        return first.isSameCity(second);
      }
      return false;
    });
  }

  /** Similar to grid.getEnd, finds the track at the given exit, and traces it to the end */
  protected getEnd(coordinates: Coordinates, exit: Exit): [Coordinates, Exit] {
    if (exit === TOWN) {
      return [coordinates, exit];
    }
    const neighbor = this.grid().getTrackConnection(coordinates, exit);
    if (neighbor == null) {
      return [coordinates, exit];
    }
    return this.grid().getEnd(neighbor, getOpposite(exit));
  }

  protected partitionTracks(space: Land, tracks: TrackInfo[]): Partitioned {
    const preserved: TrackInfo[] = [];
    const rerouted: TrackInfo[] = [];
    const newTracks: TrackInfo[] = [];
    for (const trackInfo of tracks) {
      const oldTrack = this.oldTrack(space, trackInfo);
      if (oldTrack == null) {
        newTracks.push(trackInfo);
        continue;
      }
      const reroutedExit = oldTrack.getExits().find((exit) => !trackInfo.exits.includes(exit));
      if (reroutedExit != null) {
        assert(reroutedExit !== TOWN, 'cannot reroute town');
        rerouted.push(trackInfo);
        continue;
      }
      preserved.push(trackInfo);
    }
    return { preserved, newTracks, rerouted };
  }

  private oldTrack(space: Land, newTrack: TrackInfo): Track | undefined {
    const oldTrackList = space.getTrack().filter((track) => {
      return newTrack.exits.some((exit) => exit !== TOWN && track.hasExit(exit));
    });
    if (oldTrackList.length > 1) {
      throw new Error('rerouting multiple routes is technically possible, but unsupported');
    }
    return oldTrackList[0];
  }

  protected newTrackExtendsPrevious(playerColor: PlayerColor, space: Land, newTracks: TrackInfo[]): boolean {
    // if it's a town tile, only one of the track needs to be placeable
    const hasTown = newTracks.some(track => track.exits.some(exit => exit === TOWN));
    if (hasTown) {
      return newTracks.some((track) => this.newTrackConnectsToOwned(space, playerColor, track));
    }
    return newTracks.every((track) => this.newTrackConnectsToOwned(space, playerColor, track));
  }

  protected newTrackConnectsToOwned(space: Land, owner: PlayerColor, newTrack: TrackInfo): boolean {
    return newTrack.exits.some((exit) => {
      if (exit === TOWN) {
        return space.getTrack().some((track) => track.getOwner() == owner);
      }
      const neighbor = this.grid().getNeighbor(space.coordinates, exit);
      if (neighbor == null) return false;
      if (neighbor instanceof City) return true;
      const trackExiting = neighbor.trackExiting(getOpposite(exit));
      if (trackExiting == null) return false;
      if (trackExiting.getOwner() == owner) return true;
      if (trackExiting.getOwner() != null) return false;

      // The track is unowned, check to see if it connects to a city, or to a town the owner has presense.
      const [end, endExit] = this.getEnd(trackExiting.coordinates, trackExiting.otherExit(getOpposite(exit)));
      if (endExit == TOWN) {
        const endSpace = this.grid().get(end);
        assert(endSpace instanceof Land);
        return endSpace.hasTown() && endSpace.getTrack().some((track) => track.getOwner() == owner);
      }
      const endSpace = this.grid().get(end.neighbor(endExit));
      return endSpace instanceof City;
    });
  }

  private newTrackConnectsToAnotherPlayer(playerColor: PlayerColor, space: Land, newTracks: TrackInfo[]): boolean {
    return newTracks.some((track) => {
      return track.exits.some((exit) => {
        if (exit == TOWN) return false;
        const connection = this.grid().getTrackConnection(space.coordinates, exit);
        if (connection === undefined) return false;
        return connection.getOwner() != null && connection.getOwner() != playerColor;
      });
    });
  }
}

interface Partitioned {
  preserved: TrackInfo[];
  rerouted: TrackInfo[];
  newTracks: TrackInfo[];
}