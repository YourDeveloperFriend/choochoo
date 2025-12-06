import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  ReleaseStage,
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
