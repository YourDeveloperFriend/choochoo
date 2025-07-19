import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { map } from "./grid";

export class BalkanMapSettings implements MapSettings {
  readonly key = GameKey.BALKAN;
  readonly name = "Balkan";
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [];
  }
}
