import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { BaseBuildPhase } from "../../engine/build/phase";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { PHASE } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { ActionBundle } from "../../engine/game/phase_module";
import { ROUND } from "../../engine/game/round";
import { City } from "../../engine/map/city";
import { calculateTrackInfo, Land } from "../../engine/map/location";
import { isTownTile } from "../../engine/map/tile";
import { TOWN, TrackInfo } from "../../engine/map/track";
import { Phase } from "../../engine/state/phase";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { allDirections, Direction } from "../../engine/state/tile";
import { isNotNull } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { GOVERNMENT_COLOR } from "./government_engine_level";

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

  private readonly governmentTrack = injectState(GOVERNMENT_TRACK);
  private readonly round = injectState(ROUND);

  configureActions() {
    this.installAction(BuildAction);
  }

  protected abandonDangling() {}

  getPlayerOrder(): PlayerColor[] {
    return [this.governmentTrack()[(this.round() - 1) % 3]];
  }

  forcedAction(): ActionBundle<object> | undefined {
    return undefined;
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

  private isFirstBuildOfGame(): boolean {
    return (
      this.isGovtBuildPhase() &&
      this.round() === 1 &&
      this.buildState().buildCount! === 0
    );
  }

  private isContiguousWithExistingTrack(data: BuildData): boolean {
    const trackInfo = calculateTrackInfo(data);
    const trackIsContiguous = (track: TrackInfo) =>
      track.exits.some((exit) => {
        if (exit === TOWN) return false;
        if (this.grid().getTrackConnection(data.coordinates, exit) != null) {
          return true;
        }
        const neighbor = this.grid().getNeighbor(data.coordinates, exit);
        if (!(neighbor instanceof City)) {
          return false;
        }
        return allDirections.some((direction) => {
          return (
            this.grid().getTrackConnection(neighbor.coordinates, direction) !=
            null
          );
        });
      });
    if (isTownTile(data.tileType)) {
      return trackInfo.some(trackIsContiguous);
    } else {
      return trackInfo.every(trackIsContiguous);
    }
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

    assert(
      this.isFirstBuildOfGame() || this.isContiguousWithExistingTrack(data),
      { invalidInput: "must be contiguous with existing track" },
    );

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
