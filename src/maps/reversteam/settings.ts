import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { ReversteamMoveHelper } from "./accepts";
import { map } from "./grid";

export class ReversteamMapSettings implements MapSettings {
  readonly key = GameKey.REVERSTEAM;
  readonly name = "Reversteam";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [ReversteamMoveHelper];
  }
}
