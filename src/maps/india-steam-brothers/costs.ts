import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";

export class ExpensiveMountains extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.MOUNTAIN) {
      return 6;
    }
    return super.getCostOfLandType(type);
  }
}
