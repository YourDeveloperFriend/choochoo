import { BuilderHelper } from "../../engine/build/helper";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { calculateTrackInfo } from "../../engine/map/location";
import { Exit, TOWN, TrackInfo } from "../../engine/map/track";
import { City } from "../../engine/map/city";
import { allDirections } from "../../engine/state/tile";
import { assert, fail } from "../../utils/validate";
import { EasternUsAndCanadaMapData } from "./grid";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { Coordinates } from "../../utils/coordinates";
import { GridHelper } from "../../engine/map/grid_helper";
import { PlayerColor } from "../../engine/state/player";
import { injectCurrentPlayer } from "../../engine/game/state";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { arrayEqualsIgnoreOrder } from "../../utils/functions";
import { Grid } from "../../engine/map/grid";

export class EasternUsAndCanadaBuilderHelper extends BuilderHelper {
  private readonly currentRound = injectState(ROUND);

  getMaxBuilds(): number {
    const round = this.currentRound();
    if (round <= 8) {
      return round;
    }
    return 8;
  }
}

export class EasternUsAndCanadaBuildValidator extends Validator {
  private readonly gridHelper = inject(GridHelper);
  private readonly currentPlayer = injectCurrentPlayer();

  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason) {
      return reason;
    }

    // Expansion is unlocked (meaning track no longer needs to be contiguous) if there is any track
    // built into one of the expansion cities
    if (isExpansionUnlocked(this.grid())) {
      return;
    }

    // Otherwise, this track must either connect to already laid track or connect to a city with already by the same owner
    // or be the first track laid by the player and be connecting to a starting city.
    const space = this.grid().get(coordinates);
    if (space instanceof City) {
      return "cannot build on a city";
    }
    if (space == null || space.isUnpassable()) {
      return "cannot build on unpassable terrain";
    }
    const newTileData = calculateTrackInfo(buildData);
    const { newTracks } = this.partitionTracks(space, newTileData);

    const currentPlayer = this.currentPlayer();
    if (isFirstBuild(currentPlayer.color, this.grid())) {
      if (!this.isBuildToStartingCity(coordinates, newTracks)) {
        return "first build must connect to a starting city";
      }
    } else {
      if (
        !this.connectsToExistingNetwork(
          currentPlayer.color,
          coordinates,
          newTracks,
        )
      ) {
        return "network must be contiguous";
      }
    }
  }

  private isBuildToStartingCity(
    coordinates: Coordinates,
    newTracks: TrackInfo[],
  ): boolean {
    for (const newTrack of newTracks) {
      for (const exit of newTrack.exits) {
        if (exit === TOWN) {
          continue;
        }
        const neighbor = this.grid().getNeighbor(coordinates, exit);
        if (neighbor instanceof City) {
          if (
            neighbor.getMapSpecific(EasternUsAndCanadaMapData.parse)
              ?.startingCity
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private connectsToExistingNetwork(
    player: PlayerColor,
    coordinates: Coordinates,
    newTracks: TrackInfo[],
  ): boolean {
    const isTownTile = newTracks.some((track) =>
      track.exits.some((exit) => exit === TOWN),
    );

    if (isTownTile) {
      // Track coming from town tiles already need to connect to existing network, so just return true here
      return true;
    }

    // Every new track must have some exit connecting back to existing network
    for (const newTrack of newTracks) {
      if (
        !newTrack.exits.some((exit) =>
          this.exitConnectsToExistingNetwork(player, coordinates, exit),
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private exitConnectsToExistingNetwork(
    player: PlayerColor,
    coordinates: Coordinates,
    exit: Exit,
  ): boolean {
    if (exit === TOWN) {
      return false;
    }
    const neighbor = this.grid().getNeighbor(coordinates, exit);
    if (neighbor instanceof City) {
      return isCityInExistingNetwork(player, neighbor, this.grid());
    }
    return (
      this.grid().getTrackConnection(coordinates, exit)?.getOwner() === player
    );
  }
}

export class EasternUsAndCanadaConnectCitiesAction extends ConnectCitiesAction {
  validate(data: ConnectCitiesData): void {
    super.validate(data);

    const grid = this.grid();
    const connection = grid.getConnection(data.id);
    assert(connection !== undefined, { invalidInput: "invalid connection id" });
    const currentPlayer = this.currentPlayer();

    for (const other of grid.connections) {
      if (
        other.id !== connection.id &&
        arrayEqualsIgnoreOrder(other.connects, connection.connects) &&
        other.owner?.color === currentPlayer.color
      ) {
        fail({
          invalidInput: "each player can only have 1 connection between cities",
        });
      }
    }

    if (isExpansionUnlocked(grid)) {
      return;
    }

    const connectedCities = connection.connects
      .map((coordinates) => this.grid().get(coordinates))
      .filter((space) => space instanceof City);

    if (isFirstBuild(currentPlayer.color, grid)) {
      const connectedToStartingCity = connectedCities
        .map((city) => city.getMapSpecific(EasternUsAndCanadaMapData.parse))
        .some((mapSpecific) => mapSpecific?.startingCity);
      assert(connectedToStartingCity, {
        invalidInput: "first build must connect to a starting city",
      });
    } else {
      const player = this.currentPlayer();
      assert(
        connectedCities.some((city) =>
          isCityInExistingNetwork(player.color, city, grid),
        ),
        { invalidInput: "build must connect to existing network" },
      );
    }
  }

  process(data: ConnectCitiesData): boolean {
    const result = super.process(data);

    const newConnection = this.grid().getConnection(data.id);
    assert(newConnection !== undefined);

    let connectionsCount = 0;
    for (const connection of this.grid().connections) {
      if (arrayEqualsIgnoreOrder(connection.connects, newConnection.connects)) {
        connectionsCount += 1;
      }
    }
    this.gridHelper.addInterCityConnection({
      connects: newConnection.connects,
      cost: 2 + connectionsCount,
    });

    return result;
  }
}

function isFirstBuild(player: PlayerColor, grid: Grid): boolean {
  for (const [_, space] of grid.entries()) {
    if (space instanceof City) {
      continue;
    }
    for (const track of space.getTrack()) {
      if (track.getOwner() === player) {
        return false;
      }
    }
  }
  for (const connection of grid.connections) {
    if (connection.owner?.color === player) {
      return false;
    }
  }

  return true;
}

function isCityInExistingNetwork(
  player: PlayerColor,
  city: City,
  grid: Grid,
): boolean {
  if (
    allDirections.some(
      (direction) =>
        grid.getTrackConnection(city.coordinates, direction)?.getOwner() ===
        player,
    )
  ) {
    return true;
  }
  for (const connection of grid.connections) {
    if (
      connection.owner?.color === player &&
      connection.connects.some((end) => end.equals(city.coordinates))
    ) {
      return true;
    }
  }
  return false;
}

// Expansion is unlocked (meaning track no longer needs to be contiguous) if there is any track
// built into one of the expansion cities
function isExpansionUnlocked(grid: Grid): boolean {
  for (const space of grid.values()) {
    if (space instanceof City) {
      if (
        space.getMapSpecific(EasternUsAndCanadaMapData.parse)?.expansionCity
      ) {
        for (const exit of allDirections) {
          if (grid.getTrackConnection(space.coordinates, exit) != null) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
