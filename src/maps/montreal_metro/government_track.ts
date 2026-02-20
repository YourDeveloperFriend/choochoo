import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { BaseBuildPhase, BuildPhase } from "../../engine/build/phase";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { PHASE } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { ActionBundle } from "../../engine/game/phase_module";
import { ROUND } from "../../engine/game/round";
import { injectInGamePlayers } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { Exit, TOWN } from "../../engine/map/track";
import { Phase } from "../../engine/state/phase";
import {
  PlayerColor,
  playerColorToString,
  PlayerColorZod,
} from "../../engine/state/player";
import { allDirections, Direction } from "../../engine/state/tile";
import { isNotNull } from "../../utils/functions";
import { assert, fail } from "../../utils/validate";
import { GOVERNMENT_COLOR } from "./government_engine_level";
import { Grid } from "../../engine/map/grid";
import { Coordinates } from "../../utils/coordinates";
import { getNeighbor } from "../moon/wrap_around";
import { getOpposite } from "../../engine/map/direction";

const GovernmentTrackState = PlayerColorZod.array();
type GovernmentTrackState = z.infer<typeof GovernmentTrackState>;

export const GOVERNMENT_TRACK = new Key("GOVERNMENT_TRACK", {
  parse: GovernmentTrackState.parse,
});

export class MontrealMetroPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(MontrealMetroGovernmentBuildPhase);
  }
}

export class MontrealMetroGovernmentBuildPhase extends BaseBuildPhase {
  static readonly phase = Phase.GOVERNMENT_BUILD;

  private readonly players = injectInGamePlayers();
  private readonly governmentTrack = injectState(GOVERNMENT_TRACK);
  private readonly round = injectState(ROUND);

  configureActions() {
    this.installAction(BuildAction);
  }

  protected abandonDangling() {}

  getPlayerOrder(): PlayerColor[] {
    const playerColor = this.governmentTrack()[(this.round() - 1) % 3];
    const player = this.players().find(
      (player) => player.color === playerColor,
    );
    // Per https://boardgamegeek.com/thread/3538513/how-to-handle-player-elimination
    // Eliminated players do not build government track.
    if (player == null) {
      this.log.log(
        `${playerColorToString(playerColor)} does not build government track because they have been eliminated`,
      );
      return [];
    }
    return [playerColor];
  }

  forcedAction(): ActionBundle<object> | undefined {
    return undefined;
  }

  onEndTurn(): void {
    super.onEndTurn();
    checkHasContiguousMasterNetwork(this.grid());
  }
}

export class MontrealMetroBuildPhase extends BuildPhase {
  onEndTurn(): void {
    super.onEndTurn();
    checkHasContiguousMasterNetwork(this.grid());
  }
}

export class MontrealMetroBuildAction extends BuildAction {
  private readonly phase = injectState(PHASE);
  private readonly round = injectState(ROUND);

  protected owningPlayer(): PlayerColor {
    if (this.isGovtBuildPhase()) {
      return GOVERNMENT_COLOR;
    }
    return super.owningPlayer();
  }

  private isGovtBuildPhase(): boolean {
    return this.phase() === MontrealMetroGovernmentBuildPhase.phase;
  }

  private isContinuingExistingLink(data: BuildData): boolean {
    if (this.buildState().buildCount! === 0) {
      return true;
    }
    const existingTrackInfo = (this.grid().get(data.coordinates) as Land)
      .getTrack()
      .map((track) => track.getExits());
    const trackInfo = calculateTrackInfo(data).filter((info) => {
      return !existingTrackInfo.some((exits) =>
        exits.every((exit) => info.exits.includes(exit)),
      );
    });

    if (trackInfo.length !== 1) return false;
    return trackInfo[0].exits.some((exit) => {
      if (exit === TOWN) return false;
      const connection = this.grid().getTrackConnection(data.coordinates, exit);
      return connection != null;
    });
  }

  private buildsMultipleEdgesOfTown(data: BuildData): boolean {
    if (!isTownTile(data.tileType)) return false;

    const newInfo = calculateTrackInfo(data);
    const currentLocation = this.grid().get(data.coordinates);
    assert(currentLocation instanceof Land);
    return newInfo.length - currentLocation.getTrack().length > 1;
  }

  private resultsInDangling(data: BuildData): boolean {
    if (this.helper.buildsRemaining() > 1) {
      return false;
    }
    const trackInfo = calculateTrackInfo(data);
    const currentLocation = this.grid().get(data.coordinates);
    assert(currentLocation instanceof Land);
    const isComplete = trackInfo.every((track) => {
      const currentTrack = track.exits
        .filter((exit): exit is Direction => exit !== TOWN)
        .map((exit) => currentLocation.trackExiting(exit))
        .find(isNotNull);
      if (currentTrack != null && currentTrack.equals(track)) {
        return true;
      }
      return track.exits.every((exit) => {
        if (exit === TOWN) return true;
        if (this.grid().getTrackConnection(data.coordinates, exit) != null) {
          return true;
        }
        if (this.grid().getNeighbor(data.coordinates, exit) instanceof City) {
          return true;
        }
        return false;
      });
    });
    return !isComplete;
  }

  originalCostOf(build: BuildData): number {
    if (this.isGovtBuildPhase()) {
      return 0;
    }
    return super.originalCostOf(build);
  }

  validate(data: BuildData): void {
    super.validate(data);

    if (this.isGovtBuildPhase()) {
      this.validateGovtBuild(data);
    }
  }

  protected validateGovtBuild(data: BuildData) {
    assert(this.isContinuingExistingLink(data), {
      invalidInput: "cannot start a second link during the government build",
    });

    assert(!this.resultsInDangling(data), {
      invalidInput: "must complete the link",
    });

    assert(!this.buildsMultipleEdgesOfTown(data), {
      invalidInput: "cannot start a second link during the government build",
    });
  }
}

function checkHasContiguousMasterNetwork(grid: Grid): boolean {
  // Locate any tile with track on it as the starting point to begin a DFS of connected track
  let startingTrack: Land | undefined;
  for (const [_, space] of grid.entries()) {
    if (space instanceof Land && space.getTrack().length > 0) {
      startingTrack = space;
      break;
    }
  }
  assert(startingTrack !== undefined);

  const seenTrack: { [key: string]: boolean } = {};
  exploreConnectedTrack(
    grid,
    startingTrack.coordinates,
    startingTrack.getTrack()[0].getExits(),
    seenTrack,
  );

  // Now having explored everything, validate that all track on the grid is in the seenTrack map
  for (const [_, space] of grid.entries()) {
    if (space instanceof Land) {
      for (const track of space.getTrack()) {
        const label = serializeTrack(track.coordinates, track.getExits());
        if (!seenTrack[label]) {
          fail({
            invalidInput:
              "All track must be connected to the master network at the end of the build.",
          });
        }
      }
    }
  }

  return false;
}

function exploreConnectedTrackFromCity(
  grid: Grid,
  city: City,
  seenTrack: { [key: string]: boolean },
) {
  const label = serializeTrack(city.coordinates, [TOWN, TOWN]);
  if (seenTrack[label]) {
    return;
  }
  seenTrack[label] = true;

  for (const direction of allDirections) {
    const track = grid.getTrackConnection(city.coordinates, direction);
    if (track !== undefined) {
      exploreConnectedTrack(
        grid,
        track.coordinates,
        track.getExits(),
        seenTrack,
      );
    }
  }
  for (const other of grid.getSameCities(city)) {
    if (!other.coordinates.equals(city.coordinates)) {
      exploreConnectedTrackFromCity(grid, other, seenTrack);
    }
  }
}

function exploreConnectedTrack(
  grid: Grid,
  coordinates: Coordinates,
  track: [Exit, Exit],
  seenTrack: { [key: string]: boolean },
) {
  const label = serializeTrack(coordinates, track);
  if (seenTrack[label]) {
    return;
  }
  seenTrack[label] = true;

  for (const exit of track) {
    if (exit === TOWN) {
      const space = grid.get(coordinates);
      assert(space instanceof Land);
      for (const track of space.getTrack()) {
        exploreConnectedTrack(
          grid,
          track.coordinates,
          track.getExits(),
          seenTrack,
        );
      }
    } else {
      const neighbor = getNeighbor(grid, coordinates, exit);
      if (neighbor === undefined) {
        continue;
      }
      if (neighbor instanceof City) {
        exploreConnectedTrackFromCity(grid, neighbor, seenTrack);
      } else {
        const nextTrack = neighbor.trackExiting(getOpposite(exit));
        if (nextTrack !== undefined) {
          exploreConnectedTrack(
            grid,
            neighbor.coordinates,
            nextTrack.getExits(),
            seenTrack,
          );
        }
      }
    }
  }
}

function serializeTrack(coordinates: Coordinates, track: [Exit, Exit]): string {
  return (
    coordinates.serialize() +
    "|" +
    track
      .sort()
      .map((exit) => exit.toString())
      .join("|")
  );
}
