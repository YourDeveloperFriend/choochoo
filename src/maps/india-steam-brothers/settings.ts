import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
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
import { IndiaSteamBrothersActionNamingProvider } from "./actions";

export class IndiaSteamBrothersMapSettings implements MapSettings {
  static readonly key = GameKey.INDIA_STEAM_BROTHERS;
  readonly key = IndiaSteamBrothersMapSettings.key;
  readonly name = "India (Steam Brothers)";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
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
