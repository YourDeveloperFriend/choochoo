import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { GoodsGrowthPhase } from "../../engine/goods_growth/phase";
import { Module } from "../../engine/module/module";
import { CityGroup } from "../../engine/state/city_group";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { interCityConnections } from "../factory";
import {
  ScotlandBuildAction,
  ScotlandConnectCitiesAction,
  ScotlandMoveValidator,
} from "./ferries_connections";
import { map } from "./grid";
import { ScotlandPhaseEngine, ScotlandRoundEngine } from "./turn_order";
import { ScotlandActionNamingProvider } from "./actions";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Glasgow", "Ayr"] },
  ]);

  getOverrides() {
    return [
      ScotlandRoundEngine,
      ScotlandGoodsGrowthPhase,
      ScotlandConnectCitiesAction,
      ScotlandBuildAction,
      ScotlandMoveValidator,
      ScotlandPhaseEngine,
      ScotlandActionNamingProvider,
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
