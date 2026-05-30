import { inject } from "../../engine/framework/execution_context";
import { BuilderHelper } from "../../engine/build/helper";
import { Action } from "../../engine/state/action";
import { MexicoRoleHelper } from "./roles";
import { BuildCostCalculator } from "../../engine/build/cost";
import { LandType } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";

export class MexicoBuildHelper extends BuilderHelper {
  private readonly roles = inject(MexicoRoleHelper);

  getMaxBuilds(): number {
    const isEngineer = this.currentPlayer().selectedAction === Action.ENGINEER;
    if (this.roles.isState(this.currentPlayer().color)) {
      return isEngineer ? 4 : 3;
    }
    return isEngineer ? 3 : 2;
  }
}

export class MexicoBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.MOUNTAIN) {
      return 3;
    }
    return super.getCostOfLandType(type);
  }
}
