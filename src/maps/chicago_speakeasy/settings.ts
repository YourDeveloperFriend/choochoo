import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { ChicagoSpeakEasyStarter } from "./starter";
import { ChicagoSpeakeasyGoodsGrowthPhase } from "./goods_growth";
import {
  ChicagoSpeakEasyMoveAction,
  ChicagoSpeakEasyMoveHelper,
} from "./move_goods";
import {
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
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ChicagoSpeakEasyStarter,
      ChicagoSpeakeasyGoodsGrowthPhase,
      ChicagoSpeakEasyMoveHelper,
      ChicagoSpeakEasyMoveAction,
      ChicagoSpeakEasyAllowedActions,
      ChicagoSpeakEasyMovePhase,
    ];
  }
}
