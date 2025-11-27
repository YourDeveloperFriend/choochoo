import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";

export class PuertoRicoMapSettings implements MapSettings {
  readonly key = GameKey.PUERTO_RICO;
  readonly name = "Puerto Rico";
  readonly designer = "Ted Alspach";
  readonly implementerId = EMIL;
  // TO DO switch to 1
  readonly minPlayers = 2; 
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [];
  }
}
