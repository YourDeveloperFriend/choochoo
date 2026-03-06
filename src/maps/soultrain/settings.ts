import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { CompleteLinkBuldModule } from "../../modules/complete_link_build";
import { SoulTrainActionNamingProvider } from "./actions";
import {
  SoulTrainBuildAction,
  SoulTrainBuilderHelper,
  SoulTrainCalculator,
} from "./building";
import { SoulTrainMoveAction, SoulTrainMoveHelper } from "./delivery";
import { map } from "./grid";
import {
  SoulTrainAllowedActions,
  SoulTrainPhaseDelegator,
  SoulTrainPhaseEngine,
  SoulTrainRoundEngine,
} from "./phases";
import { SoulTrainStarter } from "./starter";

export class SoulTrainMapSettings implements MapSettings {
  readonly key = GameKey.SOUL_TRAIN;
  readonly name = "Soul Train";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
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
      SoulTrainStarter,
      SoulTrainCalculator,
      SoulTrainBuildAction,
      SoulTrainPhaseEngine,
      SoulTrainPhaseDelegator,
      SoulTrainRoundEngine,
      SoulTrainMoveHelper,
      SoulTrainMoveAction,
      SoulTrainBuilderHelper,
      SoulTrainAllowedActions,
      SoulTrainActionNamingProvider,
    ];
  }

  getModules() {
    return [new CompleteLinkBuldModule()];
  }
}
