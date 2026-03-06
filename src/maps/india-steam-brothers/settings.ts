import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { IndiaSteamBrothersActionNamingProvider } from "./actions";
import { ExpensiveMountains } from "./costs";
import {
  IndiaSteamBrothersBuildAction,
  IndiaSteamBrothersUrbanizeAction,
} from "./goods_growth";
import { map } from "./grid";
import { IndiaSteamBrothersIncomePhase } from "./monsoon";
import {
  IndiaSteamBrothersPhaseDelegator,
  IndiaSteamBrothersPhaseEngine,
} from "./production";

export class IndiaSteamBrothersMapSettings implements MapSettings {
  static readonly key = GameKey.INDIA_STEAM_BROTHERS;
  readonly key = IndiaSteamBrothersMapSettings.key;
  readonly name = "India";
  readonly designer = "Steam Brothers";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.HIGHLY_RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      ExpensiveMountains,
      IndiaSteamBrothersIncomePhase,
      IndiaSteamBrothersPhaseEngine,
      IndiaSteamBrothersPhaseDelegator,
      IndiaSteamBrothersBuildAction,
      IndiaSteamBrothersUrbanizeAction,
      IndiaSteamBrothersActionNamingProvider,
    ];
  }
}
