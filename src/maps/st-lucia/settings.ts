import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { StLuciaActionNamingProvider } from "./actions";
import { StLuciaAllowedActions } from "./allowed_actions";
import {
  StLuciaPhaseDelegator,
  StLuciaPhaseEngine,
  StLuciaRoundEngine,
} from "./bidding";
import { map } from "./grid";
import { StLuciaStarter } from "./starter";

export class StLuciaMapSettings implements MapSettings {
  readonly key = GameKey.ST_LUCIA;
  readonly name = "St. Lucia";
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
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      StLuciaRoundEngine,
      StLuciaPhaseEngine,
      StLuciaStarter,
      StLuciaPhaseDelegator,
      StLuciaAllowedActions,
      StLuciaActionNamingProvider,
    ];
  }
}
