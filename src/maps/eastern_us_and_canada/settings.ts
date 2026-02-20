import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { interCityConnections } from "../factory";
import { EasternUsAndCanadaStarter } from "./starter";
import { EasternUsAndCanadaMoveHelper } from "./move";
import { EasternUsAndCanadaMoveValidator } from "./deliver";
import {
  EasternUsAndCanadaActionNamingProvider,
  EasternUsAndCanadaAllowedActions,
} from "./allowed_actions";
import { EasternUsAndCanadaUrbanizeAction } from "./urbanize";
import { EasternUsAndCanadaGoodsGrowth } from "./goods_growth";
import {
  EasternUsAndCanadaGoodsGrowthPhase,
  EasternUsAndCanadaSelectAction,
  EasternUsAndCanadaSelectActionPhase,
} from "./production";
import {
  EasternUsAndCanadaBuilderHelper,
  EasternUsAndCanadaBuildValidator,
  EasternUsAndCanadaConnectCitiesAction,
} from "./build";

export class EasternUsAndCanadaMapSettings implements MapSettings {
  readonly key = GameKey.EASTERN_US_AND_CANADA;
  readonly name = "Eastern US & Canada";
  readonly designer = "John Bohrer";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["New York City", "New Haven"] },
    { connects: ["Trenton", "Philadelphia"] },
    { connects: ["Philadelphia", "Baltimore"] },
    { connects: ["Baltimore", "Washington, D.C."] },
  ]);

  getOverrides() {
    return [
      EasternUsAndCanadaStarter,
      EasternUsAndCanadaMoveHelper,
      EasternUsAndCanadaMoveValidator,
      EasternUsAndCanadaAllowedActions,
      EasternUsAndCanadaActionNamingProvider,
      EasternUsAndCanadaUrbanizeAction,
      EasternUsAndCanadaGoodsGrowth,
      EasternUsAndCanadaSelectAction,
      EasternUsAndCanadaSelectActionPhase,
      EasternUsAndCanadaBuilderHelper,
      EasternUsAndCanadaBuildValidator,
      EasternUsAndCanadaConnectCitiesAction,
      EasternUsAndCanadaGoodsGrowthPhase,
    ];
  }
}
