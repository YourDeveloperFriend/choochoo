import { BuildCostCalculator } from "../../engine/build/cost";
import { LandType } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";

export class MinasGeraesBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.MOUNTAIN) {
      return 5;
    }
    return super.getCostOfLandType(type);
  }
}
