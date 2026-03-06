import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";

export class BalkanMapSettings implements MapSettings {
  readonly key = GameKey.BALKAN;
  readonly name = "Balkan";
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly designer = "John Bohrer";
  readonly implementerId = EMIL;

  getOverrides() {
    return [];
  }
}
