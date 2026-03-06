import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { PolandActionNamingProvider } from "./actions";
import { PolandBuildAction } from "./building";
import { PolandBuildCostCalculator } from "./cost";
import { PolandGoodsGrowthPhase } from "./goods_growth";

import { map } from "./grid";

export class PolandMapSettings implements MapSettings {
  readonly key = GameKey.POLAND;
  readonly name = "Poland";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly designer = "John Bohrer";
  readonly implementerId = EMIL;

  getOverrides() {
    return [
      PolandGoodsGrowthPhase,
      PolandBuildAction,
      PolandActionNamingProvider,
      PolandBuildCostCalculator,
    ];
  }
}
