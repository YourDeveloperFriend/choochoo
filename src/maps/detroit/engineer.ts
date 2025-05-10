import z from "zod";
import { BuildAction, BuildData } from "../../engine/build/build";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import {
  ConnectCitiesAction,
  ConnectCitiesData,
} from "../../engine/build/connect_cities";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { BuildPhase } from "../../engine/build/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Land } from "../../engine/map/location";
import { Track } from "../../engine/map/track";
import { Action } from "../../engine/state/action";
import { InterCityConnection } from "../../engine/state/inter_city_connection";
import { Direction, TileType } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

const ENGINEER_FREE_BUILD = new Key("engineerFreeBuild", z.number());

class FreeBuildManager {
  private readonly freeBuild = injectState(ENGINEER_FREE_BUILD);
  private readonly currentPlayer = injectCurrentPlayer();

  reset() {
    if (this.freeBuild.isInitialized()) {
      this.freeBuild.delete();
    }
  }

  newCost(currentCost: number): number {
    return this.getCostDetails(currentCost).newCost;
  }

  registerBuild(currentCost: number) {
    const { newCheapestBuild } = this.getCostDetails(currentCost);
    if (newCheapestBuild != null) {
      if (this.freeBuild.isInitialized()) {
        this.freeBuild.set(newCheapestBuild);
      } else {
        this.freeBuild.initState(newCheapestBuild);
      }
    }
  }

  private getCostDetails(currentCost: number) {
    if (this.currentPlayer().selectedAction !== Action.ENGINEER) {
      return { newCost: currentCost };
    }
    if (!this.freeBuild.isInitialized()) {
      return { newCost: 0, newCheapestBuild: currentCost };
    }
    if (this.freeBuild() < currentCost) {
      return { newCost: currentCost };
    }
    return {
      newCost: this.freeBuild(),
      newCheapestBuild: currentCost,
    };
  }
}

export class DetroitBuilderHelper extends BuilderHelper {
  private readonly manager = inject(FreeBuildManager);

  protected minimumBuildCost(): number {
    return this.manager.newCost(2);
  }
}

export class DetroitBuildPhase extends BuildPhase {
  private readonly manager = inject(FreeBuildManager);
  onEndTurn() {
    this.manager.reset();
    return super.onEndTurn();
  }
}

/**
 * The logic will give the user the first build for free, then if the next build is cheaper, then
 * they'll have to pay for the previously built discounted track.
 * For example, if they build track that costs $4, $2, $3, then they'll be charged $0, $4 (instead of $2), $3.
 * Another example, if they build track that costs $4, $3, $2, then they'll be charged $0, $4 (instead of $3), $3 (instead of 2).
 */
export class DetroitCostCalculator extends BuildCostCalculator {
  private readonly manager = inject(FreeBuildManager);

  costOf(
    coordinates: Coordinates,
    newTileType: TileType,
    orientation: Direction,
  ): number {
    return this.manager.newCost(
      super.costOf(coordinates, newTileType, orientation),
    );
  }
}

export class DetroitBuildAction extends BuildAction {
  private readonly manager = inject(FreeBuildManager);

  process(data: BuildData): boolean {
    const result = super.process(data);
    this.manager.registerBuild(
      this.costCalculator.costOf(
        data.coordinates,
        data.tileType,
        data.orientation,
      ),
    );

    return result;
  }
}

export class DetroitConnectCities extends ConnectCitiesAction {
  private readonly manager = inject(FreeBuildManager);

  protected getConnectionCost(connection: InterCityConnection) {
    return this.manager.newCost(connection.cost);
  }

  process(data: ConnectCitiesData): boolean {
    const result = super.process(data);
    const connection = this.grid().findConnection(data.connect)!;
    this.manager.registerBuild(connection.cost);
    return result;
  }
}

export class DetroitClaimAction extends ClaimAction {
  private readonly manager = inject(FreeBuildManager);

  protected claimCost(track: Track) {
    return this.manager.newCost(track.claimCost());
  }

  process(data: ClaimData): boolean {
    const space = this.grid().get(data.coordinates);
    assert(space instanceof Land);
    const track = space.getTrack().find((track) => track.isClaimable());
    assert(track != null);

    const result = super.process(data);

    this.manager.registerBuild(this.claimCost(track));
    return result;
  }
}
