import { BuildCostCalculator } from "../../engine/build/cost";
import {
  BuildInfo,
  InvalidBuildReason,
  Validator,
} from "../../engine/build/validator";
import { Land } from "../../engine/map/location";
import { isComplexTile } from "../../engine/map/tile";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import { Coordinates } from "../../utils/coordinates";

export class OahuBuildCostCalculator extends BuildCostCalculator {
  protected getCostOfLandType(type: LandType): number {
    if (type === SpaceType.MOUNTAIN) {
      return 4;
    }
    if (type === SpaceType.LAKE) {
      return 6;
    }
    return super.getCostOfLandType(type);
  }
}

export class OahuValidator extends Validator {
  getInvalidBuildReason(
    coordinates: Coordinates,
    buildData: BuildInfo,
  ): InvalidBuildReason | undefined {
    const reason = super.getInvalidBuildReason(coordinates, buildData);
    if (reason !== undefined) {
      return reason;
    }

    const space = this.grid().get(coordinates);
    if (
      space instanceof Land &&
      space.getLandType() === SpaceType.LAKE &&
      space.getTileData() == null &&
      isComplexTile(buildData.tileType)
    ) {
      return "cannot initially place complex track on a water hex";
    }
    return undefined;
  }
}
