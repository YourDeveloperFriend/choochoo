import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { Action } from "../../engine/state/action";
import { AvailableActionsModule } from "../../modules/available_actions";
import { TurnLengthModule } from "../../modules/turn_length";
import { map } from "./grid";
import { AlabamaGoodsGrowthPhase } from "./growth";
import { AlabamaMoveAction } from "./move_good";
import { AlabamaRailwaysMoveInterceptor } from "./move_interceptor";
import { AlabamaRailwaysStarter } from "./starter";

export class AlabamaRailwaysMapSettings implements MapSettings {
  readonly key = GameKey.ALABAMA_RAILWAYS;
  readonly name = "Alabama Railways";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
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
      AlabamaRailwaysStarter,
      AlabamaMoveAction,
      AlabamaGoodsGrowthPhase,
      AlabamaRailwaysMoveInterceptor,
    ];
  }

  getModules() {
    return [
      new AvailableActionsModule({
        fullReplace: [Action.LOCOMOTIVE, Action.URBANIZATION],
      }),
      new TurnLengthModule({ turnLength: 8 }),
    ];
  }
}
