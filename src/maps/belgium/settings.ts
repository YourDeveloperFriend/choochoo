import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { AvailableActionsModule } from "../../modules/available_actions";
import { PhasesModule } from "../../modules/phases";
import { remove } from "../../utils/functions";
import { map } from "./grid";
import { BelgiumRoundEngine } from "./turn_order";
import { BelgiumActionNamingProvider } from "./actions";
import { BelgiumUrbanizeAction } from "./urbanize";
import {
  BelgiumBuildAction,
  BelgiumBuilderHelper,
  BelgiumBuildValidator,
} from "./build";

export class BelgiumMapSettings implements MapSettings {
  readonly key = GameKey.BELGIUM;
  readonly name = "Belgium";
  readonly designer = "John Bohrer";
  readonly implementerId = JACK;
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      BelgiumRoundEngine,
      BelgiumActionNamingProvider,
      BelgiumUrbanizeAction,
      BelgiumBuilderHelper,
      BelgiumBuildValidator,
      BelgiumBuildAction,
    ];
  }

  getModules(): Module[] {
    return [
      new PhasesModule({
        replace: (oldPhases) => remove(oldPhases, Phase.TURN_ORDER),
      }),
      new AvailableActionsModule({ remove: [Action.TURN_ORDER_PASS] }),
    ];
  }
}
