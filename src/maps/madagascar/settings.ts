import { GameKey } from "../../api/game_key";
import { SimpleConstructor } from "../../engine/framework/dependency_stack";
import {
  MapSettings,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import {
  MadagascarAllowedActions,
  MadagascarGameEnder,
  MadagascarRoundEngine,
  MadagascarStarter,
} from "./allowed_actions";
import {
  MadagascarBuildCostCalculator,
  MadagascarBuilderHelper,
  MadagascarBuildPhase,
  MadagascarDoneAction,
} from "./build";
import { map } from "./grid";
import { MadagascarMovePassAction, MadagascarMovePhase } from "./move";
import {
  MadagascarTurnOrderPass,
  MadagascarTurnOrderPhase,
} from "./turn_order";
import { MadagascarActionNamingProvider } from "./actions";

export class MadagascarMapSettings implements MapSettings {
  static readonly key = GameKey.MADAGASCAR;
  readonly key = MadagascarMapSettings.key;
  readonly name = "Madagascar";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;
  readonly rotation = Rotation.COUNTER_CLOCKWISE;

  getOverrides(): Array<SimpleConstructor<unknown>> {
    return [
      MadagascarAllowedActions,
      MadagascarBuildPhase,
      MadagascarMovePhase,
      MadagascarBuilderHelper,
      MadagascarBuildCostCalculator,
      MadagascarDoneAction,
      MadagascarGameEnder,
      MadagascarMovePassAction,
      MadagascarStarter,
      MadagascarRoundEngine,
      MadagascarTurnOrderPhase,
      MadagascarTurnOrderPass,
      MadagascarActionNamingProvider,
    ];
  }
}
