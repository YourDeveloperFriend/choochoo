import {
  CORTEXBOMB,
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  PittsburghMetroBidAction,
  PittsburghMetroSelectActionPhase,
  PittsburghMetroTurnOrderPhase,
} from "./auction";
import {
  PittsburghMetroActionNamingProvider,
  PittsburghMetroAllowedActions,
  PittsburghMetroCostCalculator,
  PittsburghMetroPhaseEngine,
  PittsburghMetroRoundEngine,
  PittsburghMetroValidator,
} from "./rules_engine";
import { PittsburghMetroSelectAction } from "./stroll";
import {
  PittsburghMetroSharesPhase,
  PittsburghMetroStarter,
} from "./municipal_development";

export class PittsburghMetroMapSettings implements MapSettings {
  readonly key = "pittsburgh-metro";
  readonly name = "Pittsburgh Metro";
  readonly designer = "Michael Webb";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NO_DATA,
    4: PlayerCountRating.NO_DATA,
    5: PlayerCountRating.NO_DATA,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [CORTEXBOMB, JACK];

  getOverrides() {
    return [
      PittsburghMetroStarter,
      PittsburghMetroSharesPhase,
      PittsburghMetroPhaseEngine,
      PittsburghMetroRoundEngine,
      PittsburghMetroAllowedActions,
      PittsburghMetroActionNamingProvider,
      PittsburghMetroSelectAction,
      PittsburghMetroSelectActionPhase,
      PittsburghMetroTurnOrderPhase,
      PittsburghMetroBidAction,
      PittsburghMetroCostCalculator,
      PittsburghMetroValidator,
    ];
  }
}
