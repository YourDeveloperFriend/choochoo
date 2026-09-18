import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Phase } from "../../engine/state/phase";
import { PhasesModule } from "../../modules/phases";
import { remove } from "../../utils/functions";
import {
  IsleOfWightAllowedActions,
  IsleOfWightPhaseNamingProvider,
  IsleOfWightSelectAction,
  IsleOfWightSelectActionPhase,
} from "./actions";
import { IsleOfWightBidAction, IsleOfWightTurnOrderPhase } from "./auction";
import { IsleOfWightBuilderHelper } from "./build";
import { IsleOfWightBuyTrainsPhase } from "./buy_trains";
import { IsleOfWightProfitHelper } from "./expenses";
import { map } from "./grid";
import {
  IsleOfWightMoveAction,
  IsleOfWightMoveHelper,
  IsleOfWightMovePhase,
} from "./move";
import { IsleOfWightRoundEngine } from "./rounds";
import { IsleOfWightScrapPhase } from "./scrap";
import { IsleOfWightShareHelper } from "./shares";
import { IsleOfWightStarter } from "./starter";

export class IsleOfWightMapSettings implements MapSettings {
  readonly key = "isle-of-wight";
  readonly name = "Isle of Wight";
  readonly designer = "Unknown";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [
      IsleOfWightStarter,
      IsleOfWightRoundEngine,
      IsleOfWightShareHelper,
      IsleOfWightTurnOrderPhase,
      IsleOfWightBidAction,
      IsleOfWightAllowedActions,
      IsleOfWightSelectAction,
      IsleOfWightSelectActionPhase,
      IsleOfWightPhaseNamingProvider,
      IsleOfWightBuilderHelper,
      IsleOfWightProfitHelper,
      IsleOfWightMoveHelper,
      IsleOfWightMoveAction,
      IsleOfWightMovePhase,
    ];
  }

  getModules() {
    return [
      new PhasesModule({
        newPhases: [IsleOfWightBuyTrainsPhase, IsleOfWightScrapPhase],
        replace: (phases) => {
          // Buy Trains sits between the auction and building; there is no
          // Goods Growth; Scrap closes out the turn.
          const result = remove(phases, Phase.GOODS_GROWTH);
          result.splice(
            result.indexOf(Phase.ACTION_SELECTION) + 1,
            0,
            Phase.STALINIST_LOCOMOTIVE,
          );
          result.push(Phase.SCRAP);
          return result;
        },
      }),
    ];
  }
}
