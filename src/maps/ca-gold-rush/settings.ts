import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
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
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      CaliforniaGoldRushStarter,
      CaliforniaGoldRushMovePhase,
      CaliforniaGoldRushPlayerHelper,
    ];
  }
}
