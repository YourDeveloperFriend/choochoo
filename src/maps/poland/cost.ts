import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";

export class PolandBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    switch (type) {
      case SpaceType.DARK_MOUNTAIN:
        return 6;
      default:
        return super.getCostOfLandType(type);
    }
  }
}
