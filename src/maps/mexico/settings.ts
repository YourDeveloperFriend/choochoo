import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { MexicoAllowedActions } from "./allowed_actions";
import { MexicoBuildCostCalculator, MexicoBuildHelper } from "./build";
import { MexicoMoveAction } from "./delivery";
import { MexicoTurnOrderHelper } from "./auction";
import { MexicoUrbanizeAction } from "./urbanize";
import { MexicoGoodsGrowthPhase } from "./goods_growth";
import { MexicoRoundEngine } from "./round";
import { MexicoStarter } from "./starter";
import { MexicoPhaseDelegator, MexicoPhaseEngine } from "./role_selection";

export class MexicoMapSettings implements MapSettings {
  readonly key = "mexico";
  readonly name = "Mexico";
  readonly designer = "Alban Viard";
  readonly implementerId = JACK;
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
      MexicoStarter,
      MexicoRoundEngine,
      MexicoAllowedActions,
      MexicoBuildHelper,
      MexicoBuildCostCalculator,
      MexicoMoveAction,
      MexicoTurnOrderHelper,
      MexicoUrbanizeAction,
      MexicoGoodsGrowthPhase,
      MexicoPhaseDelegator,
      MexicoPhaseEngine,
    ];
  }
}
