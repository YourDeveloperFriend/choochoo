import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { RoundEngine } from "../../engine/game/round";
import { GoodsGrowthPhase} from "../../engine/goods_growth/phase";
import { CityGroup} from "../../engine/state/city_group";
import { 
          ScotlandClaimAction, 
          ScotlandConnectCitiesAction, 
          ScotlandBuildAction,
} from "./ferries_connections";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
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
    ];
  }

  getModules(): Array<Module> {
      return [
        new ClaimRequiresUrbanizeModule(),
      ];
  }
}

export class ScotlandRoundEngine extends RoundEngine {

  maxRounds(): number {
    return 8;
  }
}

export class ScotlandGoodsGrowthPhase extends GoodsGrowthPhase {

  getRollCount(_: CityGroup): number {
      return 4;
  }
}