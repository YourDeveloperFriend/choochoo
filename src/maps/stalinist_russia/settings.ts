import {
  CORTEXBOMB,
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Phase } from "../../engine/state/phase";
import { PhasesModule } from "../../modules/phases";
import {
  StalinistRussiaActionNamingProvider,
  StalinistRussiaAllowedActions,
  StalinistRussiaSelectAction,
} from "./actions";
import { StalinistRussiaBuildCostCalculator } from "./build";
import {
  StalinistRussiaPlayerHelper,
  StalinistRussiaTurnOrderHelper,
} from "./disfavor";
import { StalinistRussiaProfitHelper } from "./expenses";
import { map } from "./grid";
import { StalinistRussiaLocomotivePhase } from "./locomotive_phase";
import {
  StalinistRussiaMoveAction,
  StalinistRussiaMoveHelper,
  StalinistRussiaMovePhase,
  StalinistRussiaMoveValidator,
} from "./move";
import { StalinistRussiaStarter } from "./starter";

export class StalinistRussiaMapSettings implements MapSettings {
  readonly key = "stalinist-russia";
  readonly name = "Stalinist Russia";
  readonly designer = "Michael Webb";
  readonly implementerId = JACK;
  readonly minPlayers = 4;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, CORTEXBOMB];

  getOverrides() {
    return [
      StalinistRussiaStarter,
      StalinistRussiaTurnOrderHelper,
      StalinistRussiaPlayerHelper,
      StalinistRussiaAllowedActions,
      StalinistRussiaSelectAction,
      StalinistRussiaActionNamingProvider,
      StalinistRussiaBuildCostCalculator,
      StalinistRussiaProfitHelper,
      StalinistRussiaMoveHelper,
      StalinistRussiaMoveValidator,
      StalinistRussiaMoveAction,
      StalinistRussiaMovePhase,
    ];
  }

  getModules() {
    return [
      new PhasesModule({
        newPhases: [StalinistRussiaLocomotivePhase],
        replace: (phases) => {
          const result = [...phases];
          const index = result.indexOf(Phase.ACTION_SELECTION);
          result.splice(index + 1, 0, Phase.STALINIST_LOCOMOTIVE);
          return result;
        },
      }),
    ];
  }
}
