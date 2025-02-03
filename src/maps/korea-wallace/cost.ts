import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";

export class KoreaWallaceCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    switch (type) {
      case SpaceType.MOUNTAIN:
      case SpaceType.HILL:
        return 3;
      default:
        return super.getCostOfLandType(type);
    }
  }
}
