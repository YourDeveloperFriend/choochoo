import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";

export class RustBeltMapSettings implements MapSettings {
  readonly key = GameKey.RUST_BELT;
  readonly name = "Rust Belt";
  readonly designer = "John Bohrer";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly bestAt = "4-5";
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.MIXED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.HIGHLY_RECOMMENDED,
    6: PlayerCountRating.NOT_RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [];
  }
}
