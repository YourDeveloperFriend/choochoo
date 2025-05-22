import { GameKey } from "../../api/game_key";
import {
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { AvailableActionsModule } from "../../modules/available_actions";
import { CompleteLinkBuldModule } from "../../modules/complete_link_build";
import { PhasesModule } from "../../modules/phases";
import { remove } from "../../utils/functions";
import { NewEnglandMovePhase } from "./extra_move";
import { map } from "./grid";
import { NewEnglandPlayerHelper } from "./score";
import { NewEnglandRoundEngine, NewEnglandStarter } from "./turn_order";

export class NewEnglandMapSettings implements MapSettings {
  readonly key = GameKey.NEW_ENGLAND;
  readonly name = "New England";
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly rotation = Rotation.CLOCKWISE;

  getOverrides() {
    return [
      NewEnglandRoundEngine,
      NewEnglandMovePhase,
      NewEnglandPlayerHelper,
      NewEnglandStarter,
    ];
  }

  getModules(): Module[] {
    return [
      new PhasesModule({
        replace: (oldPhases) => remove(oldPhases, Phase.TURN_ORDER),
      }),
      new CompleteLinkBuldModule(),
      new AvailableActionsModule({ remove: [Action.TURN_ORDER_PASS] }),
    ];
  }
}
