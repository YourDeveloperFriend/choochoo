import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { RoundEngine } from "../../engine/game/round";
import { map } from "./grid";

export class ScotlandMapSettings implements MapSettings {
  readonly key = GameKey.SCOTLAND;
  readonly name = "Scotland";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [ScotlandRoundEngine];
  }
}

export class ScotlandRoundEngine extends RoundEngine {

  maxRounds(): number {
    return 8;
  }
}