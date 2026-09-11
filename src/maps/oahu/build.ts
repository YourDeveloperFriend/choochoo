import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { isComplexTile } from "../../engine/map/tile";
import { SpaceType } from "../../engine/state/location_type";
import { LandType } from "../../engine/state/space";
import { ComplexTileType, SimpleTileType } from "../../engine/state/tile";

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

  protected getTileCost(tileType: SimpleTileType | ComplexTileType): number {
    if (isComplexTile(tileType)) {
      return 3;
    }
    return super.getTileCost(tileType);
  }
}

export class OahuBuilderHelper extends BuilderHelper {
  private readonly playerCount = injectInitialPlayerCount();

  getMaxBuilds(): number {
    if (this.playerCount() === 3) {
      return 4;
    }
    return super.getMaxBuilds();
  }
}
