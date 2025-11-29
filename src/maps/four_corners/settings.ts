import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
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
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [FourCornersGameStarter, FourCornersMoveAction];
  }
}
