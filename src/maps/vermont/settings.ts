import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  VermontSelectAction,
  VermontSelectActionPhase,
} from "./action_selection";
import { VermontStarter } from "./starter";
import { VermontBuildCostCalculator } from "./building";
import { VermontMoveAction } from "./delivery";

export class VermontMapSettings implements MapSettings {
  readonly key = "vermont";
  readonly name = "Vermont";
  readonly designer = "Ted Alspach";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.MIXED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      VermontSelectActionPhase,
      VermontSelectAction,
      VermontStarter,
      VermontBuildCostCalculator,
      VermontMoveAction,
    ];
  }
}
