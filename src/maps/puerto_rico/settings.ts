import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { PuertoRicoStarter } from "./starter";
import { PuertoRicoActions, PuertoRicoSelectAction } from "./actions";
import { PuertoRicoPhaseEngine } from "./phases";
import { PuertoRicoMoveAction } from "./move";
import { PuertoRicoSelectActionPhase, PuertoRicoSkipAction } from "./actions";
import { PuertoRicoPlayerHelper } from "./player";

export class PuertoRicoMapSettings implements MapSettings {
  readonly key = GameKey.PUERTO_RICO;
  readonly name = "Puerto Rico";
  readonly designer = "Ted Alspach";
  readonly implementerId = EMIL;
  readonly minPlayers = 1;
  readonly maxPlayers = 1;
  readonly playerCountRatings = {
    1: PlayerCountRating.HIGHLY_RECOMMENDED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;

  getOverrides() {
    return [
      PuertoRicoStarter,
      PuertoRicoActions,
      PuertoRicoPhaseEngine,
      PuertoRicoMoveAction,
      PuertoRicoSelectAction,
      PuertoRicoSelectActionPhase,
      PuertoRicoSkipAction,
      PuertoRicoPlayerHelper,
    ];
  }

  getModules(): Array<Module> {
    return [new TurnLengthModule({ turnLength: 10 })];
  }
}
