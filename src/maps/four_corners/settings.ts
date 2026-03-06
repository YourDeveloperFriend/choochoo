import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { FourCornersGameStarter } from "./starter";
import { FourCornersMoveAction } from "./move";

export class FourCornersMapSettings implements MapSettings {
  static readonly key = GameKey.FOUR_CORNERS;
  readonly key = FourCornersMapSettings.key;
  readonly name = "Four Corners";
  readonly designer = "Ted Alspach";
  readonly implementerId = EMIL;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [FourCornersGameStarter, FourCornersMoveAction];
  }
}
