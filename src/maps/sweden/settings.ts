import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  SwedenMoveAction,
  SwedenMovePhase,
  SwedenPhaseEngine,
} from "./recycling";
import { SwedenAllowedActions } from "./recycling_score";
import { SwedenPlayerHelper } from "./score";
import { SwedenStarter } from "./starter";

export class SwedenRecyclingMapSettings implements MapSettings {
  static readonly key = GameKey.SWEDEN;
  readonly key = SwedenRecyclingMapSettings.key;
  readonly name = "Sweden Recycling";
  readonly designer = "Chad Krizen";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.HIGHLY_RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.HIGHLY_RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      SwedenStarter,
      SwedenAllowedActions,
      SwedenMovePhase,
      SwedenMoveAction,
      SwedenPlayerHelper,
      SwedenPhaseEngine,
    ];
  }
}
