import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { HeavyCardboardClaimAction } from "./ferries";
import { map } from "./grid";
import {
  HeavyCardboardGoodsGrowth,
  HeavyCardboardStarter,
} from "./heavy_cardboard_city";
import {
  HeavyCardboardActions,
  HeavyCardboardBuildPhase,
  HeavyCardboardMovePhase,
} from "./heavy_lifting";

export class HeavyCardboardMapSettings implements MapSettings {
  readonly key = GameKey.HEAVY_CARDBOARD;
  readonly name = "Heavy Cardboard";
  readonly designer = "Kevin M";
  readonly implementerId = KAOSKODY;
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

  getOverrides() {
    return [
      HeavyCardboardBuildPhase,
      HeavyCardboardStarter,
      HeavyCardboardGoodsGrowth,
      HeavyCardboardActions,
      HeavyCardboardClaimAction,
      HeavyCardboardMovePhase,
    ];
  }
}
