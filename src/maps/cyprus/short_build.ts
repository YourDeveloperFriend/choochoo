import { CyprusVariantConfig } from "../../api/variant_config";
import { BuildCostCalculator } from "../../engine/build/cost";
import { BuilderHelper } from "../../engine/build/helper";
import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { Action } from "../../engine/state/action";
import { LandType } from "../../engine/state/space";
import { TileType } from "../../engine/state/tile";

export class ShortBuild extends BuilderHelper {
  getMaxBuilds(): number {
    return this.currentPlayer().selectedAction === Action.ENGINEER ? 3 : 2;
  }
}

export class CyprusCostCalculator extends BuildCostCalculator {
  private readonly gameMemory = inject(GameMemory);

  protected getCostOfLandType(type: LandType): number {
    if (this.gameMemory.getVariant(CyprusVariantConfig.parse).variant2020) {
      return 3;
    }
    return super.getCostOfLandType(type);
  }

  protected getRedirectCost(
    previousTileType: TileType,
    newTileType: TileType,
  ): number {
    if (this.gameMemory.getVariant(CyprusVariantConfig.parse).variant2020) {
      return 3;
    }
    return super.getRedirectCost(previousTileType, newTileType);
  }
}
