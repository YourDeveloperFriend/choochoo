import { BuilderHelper } from "../../engine/build/helper";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { Action } from "../../engine/state/action";
import { Key } from "../../engine/framework/key";
import { z } from "zod";
import {
  injectCurrentPlayer,
  injectInitialPlayerCount,
} from "../../engine/game/state";
import { BuildCostCalculator } from "../../engine/build/cost";
import { LandType } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";
import { BuildAction, BuildData } from "../../engine/build/build";
import { DoubleBaseUsaMapData } from "./grid";
import {
  DoubleBaseUsaPlayerData,
  TranscontinentalBonusClaimed,
} from "./starter";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { Exit, TOWN, TrackInfo } from "../../engine/map/track";
import { PlayerColor } from "../../engine/state/player";
import { allDirections, Direction, TileType } from "../../engine/state/tile";
import { Grid } from "../../engine/map/grid";
import { City } from "../../engine/map/city";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { ImmutableMap } from "../../utils/immutable";
import { LAND_GRANT_BUILD_STATE } from "./starting_city";
import { EmptyActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";

export const URBANIZE_COUNT = new Key("UrbanizeCount", z.number());

export class DoubleBaseUsaBuilderHelper extends BuilderHelper {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly round = injectState(ROUND);
  private readonly urbanizeCount = injectState(URBANIZE_COUNT);
  private readonly landGrantBuildState = injectState(LAND_GRANT_BUILD_STATE);
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);

  canUrbanize(): boolean {
    const urbanizeCount = this.urbanizeCount();
    return (
      this.currentPlayer().selectedAction === Action.URBANIZATION &&
      ((!this.isDoubleBuildRound() && urbanizeCount < 1) ||
        (this.isDoubleBuildRound() && urbanizeCount < 2))
    );
  }

  shouldAutoPass(): boolean {
    if (this.landGrantBuildState().spentNow === true) {
      return false;
    }
    if (this.playerData().get(this.currentPlayer().color)!.landGrants > 0) {
      return false;
    }
    return super.shouldAutoPass();
  }

  getMaxBuilds(): number {
    const baseCount: number = this.isDoubleBuildRound()
      ? this.currentPlayer().selectedAction === Action.ENGINEER
        ? 8
        : 6
      : this.currentPlayer().selectedAction === Action.ENGINEER
        ? 4
        : 3;
    return baseCount + this.landGrantBuildState().totalSpent;
  }

  protected ownershipMarkerLimit(): number {
    return super.ownershipMarkerLimit() * 2;
  }

  protected startingManifest(): ImmutableMap<TileType, number> {
    return super
      .startingManifest()
      .mapEntries(([type, count]) => [type, count * 2]);
  }

  private isDoubleBuildRound(): boolean {
    if (this.playerCount() <= 5) {
      return this.round() >= 5;
    }
    return this.round() >= 4;
  }
}

export class DoubleBaseUsaBuildValidator extends Validator {
  private readonly currentPlayer = injectCurrentPlayer();

  protected townDiscCount(): number {
    return super.townDiscCount() * 2;
  }

  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason) {
      return reason;
    }

    const grid = this.grid();
    const space = grid.get(coordinates);
    if (space instanceof City) {
      return "cannot build on a city";
    }
    if (space == null || space.isUnpassable()) {
      return "cannot build on unpassable terrain";
    }
    const newTileData = calculateTrackInfo(buildData);
    const { newTracks } = this.partitionTracks(space, newTileData);
    const currentPlayer = this.currentPlayer();

    // Assert contiguous
    if (isFirstBuild(currentPlayer.color, grid)) {
      if (
        !this.isBuildToStartingCity(currentPlayer.color, coordinates, newTracks)
      ) {
        return "first build must connect to your starting city";
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
    player: PlayerColor,
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
            neighbor.getMapSpecific(DoubleBaseUsaMapData.parse)
              ?.startingPlayer === player
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

export class DoubleBaseUsaBuildAction extends BuildAction {
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  private readonly transcontinentalBonusClaimed = injectState(
    TranscontinentalBonusClaimed,
  );
  private readonly landGrantBuildState = injectState(LAND_GRANT_BUILD_STATE);

  process(data: BuildData): boolean {
    const result = super.process(data);
    const currentPlayer = this.currentPlayer();

    // If the player spent a land grant, reset it now that it has been used
    if (this.landGrantBuildState().spentNow === true) {
      this.landGrantBuildState.update((state) => {
        state.spentNow = false;
      });
    }

    // Check for and apply transcontinental bonus
    if (
      !this.transcontinentalBonusClaimed() &&
      this.connectsToSanFrancisco(data) &&
      this.playerIsConnectedToEastCoastCity(currentPlayer.color)
    ) {
      this.transcontinentalBonusClaimed.set(true);
      this.playerHelper.updateCurrentPlayer((player) => {
        player.money += 10;
        player.income += 1;
      });
      this.log.currentPlayer(
        "receives the transcontinental bonus and gets $10 and 1 income",
      );
    }

    // Apply land grant if the space had one
    const mapSpecific = this.gridHelper
      .lookup(data.coordinates)
      ?.getMapSpecific(DoubleBaseUsaMapData.parse);
    if (mapSpecific && mapSpecific.hasLandGrant === true) {
      this.gridHelper.update(data.coordinates, (space) => {
        space.mapSpecific.hasLandGrant = false;
      });
      this.playerData.update((playerData) => {
        playerData.get(currentPlayer.color)!.landGrants += 1;
      });
    }

    // If a player can spend land grants, do not automatically end their turn
    if (this.playerData().get(currentPlayer.color)!.landGrants > 0) {
      return false;
    }

    return result;
  }

  private connectsToSanFrancisco(data: BuildData): boolean {
    const currentPlayer = this.currentPlayer();
    const space = this.gridHelper.lookup(data.coordinates);
    if (space instanceof Land) {
      for (const track of space.getTrack()) {
        if (track.getOwner() === currentPlayer.color) {
          for (const exit of track.getExits()) {
            if (exit !== TOWN) {
              const neighbor = this.grid().getNeighbor(space.coordinates, exit);
              if (
                neighbor !== undefined &&
                neighbor.name() === "San Francisco"
              ) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  private playerIsConnectedToEastCoastCity(player: PlayerColor): boolean {
    for (const city of this.gridHelper.findAllCities()) {
      const mapSpecific = city.getMapSpecific(DoubleBaseUsaMapData.parse);
      if (mapSpecific && mapSpecific.eastCoastCity) {
        for (const direction of allDirections) {
          const track = this.grid().getTrackConnection(
            city.coordinates,
            direction,
          );
          if (track && track.getOwner() === player) {
            return true;
          }
        }
        for (const connection of this.grid().connections) {
          if (
            connection.owner?.color === player &&
            connection.connects.some((end) => end.equals(city.coordinates))
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

export class DoubleBaseUsaConnectCitiesAction extends ConnectCitiesAction {
  validate(data: ConnectCitiesData): void {
    super.validate(data);

    const grid = this.grid();
    const connection = grid.getConnection(data.id);
    assert(connection !== undefined, { invalidInput: "invalid connection id" });
    const currentPlayer = this.currentPlayer();

    const connectedCities = connection.connects
      .map((coordinates) => this.grid().get(coordinates))
      .filter((space) => space instanceof City);

    if (isFirstBuild(currentPlayer.color, grid)) {
      const connectedToStartingCity = connectedCities
        .map((city) => city.getMapSpecific(DoubleBaseUsaMapData.parse))
        .some(
          (mapSpecific) => mapSpecific?.startingPlayer === currentPlayer.color,
        );
      assert(connectedToStartingCity, {
        invalidInput: "first build must connect to your starting city",
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
}

export class DoubleBaseUsaCostCalculator extends BuildCostCalculator {
  private readonly landGrantBuildState = injectState(LAND_GRANT_BUILD_STATE);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    if (this.landGrantBuildState().spentNow === true) {
      return 0;
    }
    return super.costOf(coordinates, newTileType, orientation);
  }

  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.DARK_MOUNTAIN) {
      return 6;
    }
    return super.getCostOfLandType(type);
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

export class DoubleBaseUsaSpendLandGrantAction extends EmptyActionProcessor {
  static readonly action = "spend-land-grant";
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly landGrantBuildState = injectState(LAND_GRANT_BUILD_STATE);
  private readonly log = inject(Log);

  canEmit(): boolean {
    const currentPlayer = this.currentPlayer();
    if (this.playerData().get(currentPlayer.color)!.landGrants > 0) {
      return true;
    }
    return false;
  }

  validate(): void {
    const currentPlayer = this.currentPlayer();
    assert(this.playerData().get(currentPlayer.color)!.landGrants > 0, {
      invalidInput: "player has no land grants to spend",
    });
  }

  process(): boolean {
    const currentPlayer = this.currentPlayer();
    this.playerData.update((playerData) => {
      playerData.get(currentPlayer.color)!.landGrants -= 1;
    });
    this.landGrantBuildState.update((landGrantBuildState) => {
      landGrantBuildState.spentNow = true;
      landGrantBuildState.totalSpent += 1;
    });
    this.log.currentPlayer("spends a land grant to build a free extra tile");
    return false;
  }
}
