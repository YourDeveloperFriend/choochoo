import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { CaliforniaGoldRushStarter } from "./starter";
import { CaliforniaGoldRushMovePhase } from "./mine_action";
import { CaliforniaGoldRushPlayerHelper } from "./score";

export class CaliforniaGoldRushMapSettings implements MapSettings {
  readonly key = GameKey.CALIFORNIA_GOLD_RUSH;
  readonly name = "California Gold Rush";
  readonly designer = "Ted Alspach";
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
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      CaliforniaGoldRushStarter,
      CaliforniaGoldRushMovePhase,
      CaliforniaGoldRushPlayerHelper,
    ];
  }
}
