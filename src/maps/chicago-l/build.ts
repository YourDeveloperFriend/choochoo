import { BuilderHelper } from "../../engine/build/helper";
import { injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { GOVERNMENT_COLOR } from "./starter";
import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { ChicagoLGovernmentBuildPhase } from "./government_track";
import { BuildCostCalculator } from "../../engine/build/cost";
import { LandType } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";

export class ChicagoLUrbanizeAction extends UrbanizeAction {
  process(data: UrbanizeData): boolean {
    this.buildState.update((state) => {
      state.buildCount!++;
    });
    return super.process(data);
  }
}

export class ChicagoLBuilderHelper extends BuilderHelper {
  private readonly phase = injectState(PHASE);

  getMaxBuilds(): number {
    return 4;
  }

  isAtEndOfTurn(): boolean {
    if (this.phase() !== ChicagoLGovernmentBuildPhase.phase) {
      // Urbanization uses a build.
      return this.buildsRemaining() === 0;
    }

    return (
      this.buildState().buildCount! > 0 &&
      this.grid().getDanglers(GOVERNMENT_COLOR).length === 0
    );
  }
}

export class ChicagoLBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.RIVER) {
      return 4;
    }
    return super.getCostOfLandType(type);
  }
}
