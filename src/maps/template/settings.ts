import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";

export class TTTCAMEL_CASEMapSettings implements MapSettings {
  readonly key = GameKey.REVERSTEAM;
  readonly name = "TTTNAME";
  readonly designer = "TTTDESIGNER";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  // Optional: Add brief description of what player counts work best
  // readonly bestAt = "4-5";
  // Optional: Define per-player-count ratings for map selector
  // Rating symbols: ? (no data), -- (not supported), - (not recommended), 
  //                 + (recommended), ++ (highly recommended), +- (mixed)
  // Reference: https://boardgamegeek.com/thread/2930352/article/41563109
  // readonly playerCountRatings = {
  //   3: PlayerCountRating.RECOMMENDED,
  //   4: PlayerCountRating.HIGHLY_RECOMMENDED,
  //   5: PlayerCountRating.HIGHLY_RECOMMENDED,
  //   6: PlayerCountRating.RECOMMENDED,
  // };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [];
  }
}
