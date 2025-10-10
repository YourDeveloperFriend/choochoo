import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { ChicagoSpeakEasyStarter } from "./starter";
import { ChicagoSpeakeasyGoodsGrowthPhase } from "./goods_growth";
import {
  ChicagoSpeakEasyMoveAction,
  ChicagoSpeakEasyMoveHelper,
} from "./move_goods";
import {
  ChicagoSpeakEasyActionNamingProvider,
  ChicagoSpeakEasyAllowedActions,
  ChicagoSpeakEasyMovePhase,
} from "./bump_off";

export class ChicagoSpeakeasyMapSettings implements MapSettings {
  readonly key = GameKey.CHICAGO_SPEAKEASY;
  readonly name = "Chicago Speakeasy";
  readonly designer = "Ashley Miller";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ChicagoSpeakEasyStarter,
      ChicagoSpeakeasyGoodsGrowthPhase,
      ChicagoSpeakEasyMoveHelper,
      ChicagoSpeakEasyMoveAction,
      ChicagoSpeakEasyAllowedActions,
      ChicagoSpeakEasyActionNamingProvider,
      ChicagoSpeakEasyMovePhase,
    ];
  }
}
