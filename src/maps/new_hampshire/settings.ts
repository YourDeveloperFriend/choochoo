import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { NewHampshireBuildAction, NewHampshireUrbanizeAction } from "./build";
import { NewHampshireMoveAction } from "./delivery";

export class NewHampshireMapSettings implements MapSettings {
  readonly key = "new-hampshire";
  readonly name = "New Hampshire";
  readonly designer = "Ted Alspach";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.HIGHLY_RECOMMENDED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      NewHampshireBuildAction,
      NewHampshireUrbanizeAction,
      NewHampshireMoveAction,
    ];
  }
}
