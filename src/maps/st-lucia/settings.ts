import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { StLuciaAllowedActions } from "./allowed_actions";
import {
  StLuciaPhaseDelegator,
  StLuciaPhaseEngine,
  StLuciaRoundEngine,
} from "./bidding";
import { map } from "./grid";
import { StLuciaStarter } from "./starter";
import { StLuciaActionNamingProvider } from "./actions";

export class StLuciaMapSettings implements MapSettings {
  readonly key = GameKey.ST_LUCIA;
  readonly name = "St. Lucia";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
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
