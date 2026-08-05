import { BuildCostCalculator } from "../../engine/build/cost";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";

// Wyoming repurposes the (otherwise unused on this map) dark mountain terrain
// as the rules' "high mountain" terrain, which costs $6 to build on.
export class WyomingBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.DARK_MOUNTAIN) {
      return 6;
    }
    return super.getCostOfLandType(type);
  }
}
