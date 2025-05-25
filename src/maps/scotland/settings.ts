import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { GoodsGrowthPhase} from "../../engine/goods_growth/phase";
import { CityGroup} from "../../engine/state/city_group";
import { 
          ScotlandClaimAction, 
          ScotlandConnectCitiesAction, 
          ScotlandBuildAction,
} from "./ferries_connections";
import { 
          ScotlandRoundEngine,
          ScotlandPhaseEngine,
} from "./turn_order";
import { interCityConnections } from "../factory";
import { map } from "./grid";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly interCityConnections = interCityConnections(map, [
      ["Glasgow", "Ayr"],
    ]);

  getOverrides() {
    return [
      ScotlandRoundEngine,
      ScotlandClaimAction,
      ScotlandGoodsGrowthPhase,
      ScotlandConnectCitiesAction,
      ScotlandBuildAction,
      ScotlandPhaseEngine,
    ];
  }
}

export class ScotlandGoodsGrowthPhase extends GoodsGrowthPhase {

  getRollCount(_: CityGroup): number {
      return 4;
  }
}