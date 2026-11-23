import { Set as ImmutableSet } from "immutable";
import { BuildCostCalculator } from "../../engine/build/cost";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { PhaseEngine } from "../../engine/game/phase";
import { RoundEngine } from "../../engine/game/round";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { Land } from "../../engine/map/location";
import { isComplexTile } from "../../engine/map/tile";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import { remove } from "../../utils/functions";
import { Coordinates } from "../../utils/coordinates";
import { STROLL } from "./stroll";

export class PittsburghMetroPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return remove(super.phaseOrder(), Phase.GOODS_GROWTH);
  }
}

export class PittsburghMetroRoundEngine extends RoundEngine {
  maxRounds(): number {
    switch (this.playerCount()) {
      case 3:
        return 9;
      case 4:
        return 8;
      default:
        return 7;
    }
  }
}

export class PittsburghMetroAllowedActions extends AllowedActions {
  private readonly playerCount = injectInitialPlayerCount();

  getActions(): ImmutableSet<Action> {
    return super.getActions().withMutations((set) => {
      set.delete(Action.URBANIZATION).delete(Action.PRODUCTION).add(STROLL);
      if (this.playerCount() < 4) {
        set.delete(Action.TURN_ORDER_PASS);
      }
    });
  }
}

export class PittsburghMetroActionNamingProvider extends ActionNamingProvider {
  getActionString(action?: Action): string {
    if (action === STROLL) {
      return "Stroll";
    }
    return super.getActionString(action);
  }

  getActionDescription(action: Action): string {
    if (action === STROLL) {
      return "Immediately move one cube from one city to a different city within three hexes.";
    }
    return super.getActionDescription(action);
  }
}

export class PittsburghMetroCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.RIVER) {
      return 4;
    }
    if (type === SpaceType.DARK_MOUNTAIN) {
      return 6;
    }
    return super.getCostOfLandType(type);
  }
}

export class PittsburghMetroValidator extends Validator {
  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const space = this.grid().get(coordinates);
    if (
      space instanceof Land &&
      space.getLandType() === SpaceType.RIVER &&
      isComplexTile(buildData.tileType)
    ) {
      return "cannot build complex track on river/water";
    }
    return super.getInvalidBuildReason(coordinates, buildData);
  }
}
