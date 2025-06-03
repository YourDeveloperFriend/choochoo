import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { GoodsGrowthPhase} from "../../engine/goods_growth/phase";
import { CityGroup} from "../../engine/state/city_group";
import { ScotlandConnectCitiesAction, 
         ScotlandBuildAction,
         ScotlandMoveValidator 
        } from "./ferries_connections";
import { ScotlandRoundEngine, ScotlandPhaseEngine } from "./turn_order";
import { interCityConnections } from "../factory";
import { map } from "./grid";
import { Module } from "../../engine/module/module";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
      {connects : ["Glasgow", "Ayr"]},
    ]);

  getOverrides() {
    return [
      ScotlandRoundEngine,
      ScotlandGoodsGrowthPhase,
      ScotlandConnectCitiesAction,
      ScotlandBuildAction,
      ScotlandMoveValidator,
      ScotlandPhaseEngine,
    ];
  }

  getModules(): Array<Module> {
    return [
      new ClaimRequiresUrbanizeModule(),
    ];
  }

}

export class ScotlandGoodsGrowthPhase extends GoodsGrowthPhase {

  getRollCount(_: CityGroup): number {
      return 4;
  }
}