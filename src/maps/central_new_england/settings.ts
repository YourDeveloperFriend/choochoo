import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  CentralNewEnglandSelectAction,
  CentralNewEnglandSelectActionPhase,
} from "./action_selection";
import { CentralNewEnglandRoundEngine } from "./turn_length";
import {
  CentralNewEnglandBuildAction,
  CentralNewEnglandBuildCostCalculator,
  CentralNewEnglandUrbanizeAction,
} from "./building";
import { CentralNewEnglandMoveAction } from "./delivery";
import { CentralNewEnglandStarter } from "./starter";
import { CentralNewEnglandActionNamingProvider } from "./actions";
import { CentralNewEnglandAllowedActions } from "./allowed_actions";
import { CentralNewEnglandGoodsGrowthPhase } from "./production";

export class CentralNewEnglandMapSettings implements MapSettings {
  readonly key = "central-new-england";
  readonly name = "Central New England";
  readonly designer = "Ted Alspach";
  readonly implementerId = JACK;
  readonly minPlayers = 5;
  readonly maxPlayers = 8;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.HIGHLY_RECOMMENDED,
    8: PlayerCountRating.RECOMMENDED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      CentralNewEnglandSelectActionPhase,
      CentralNewEnglandSelectAction,
      CentralNewEnglandRoundEngine,
      CentralNewEnglandBuildCostCalculator,
      CentralNewEnglandMoveAction,
      CentralNewEnglandStarter,
      CentralNewEnglandBuildAction,
      CentralNewEnglandUrbanizeAction,
      CentralNewEnglandActionNamingProvider,
      CentralNewEnglandAllowedActions,
      CentralNewEnglandGoodsGrowthPhase,
    ];
  }
}
