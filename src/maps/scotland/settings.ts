import { GameKey } from "../../api/game_key";
import {
  GRIMIKU,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { Module } from "../../engine/module/module";
import { CityGroup } from "../../engine/state/city_group";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { ScotlandActionNamingProvider } from "./actions";
import { ScotlandUrbanizeAction } from "./ayr_link";
import { map } from "./grid";
import { ScotlandPhaseEngine, ScotlandRoundEngine } from "./turn_order";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly designer = "Kevin Duffy";
  readonly implementerId = GRIMIKU;
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.HIGHLY_RECOMMENDED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ScotlandRoundEngine,
      ScotlandGoodsGrowthPhase,
      ScotlandPhaseEngine,
      ScotlandActionNamingProvider,
      ScotlandUrbanizeAction,
    ];
  }

  getModules(): Array<Module> {
    return [new ClaimRequiresUrbanizeModule()];
  }
}

class ScotlandGoodsGrowthPhase extends GoodsGrowthPhase {
  getRollCount(_: CityGroup): number {
    return 4;
  }
}
