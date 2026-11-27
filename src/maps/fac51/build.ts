import { BuildCostCalculator } from "../../engine/build/cost";
import { LandType } from "../../engine/state/space";

export class Fac51BuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(_: LandType): number {
    return 3;
  }
}
