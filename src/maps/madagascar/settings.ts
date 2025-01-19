import {SimpleConstructor} from "../../engine/framework/dependency_stack";
import {MapSettings, ReleaseStage, Rotation} from "../../engine/game/map_settings";
import {
  MadagascarAllowedActions,
  MadagascarGameEnder,
  MadagascarRoundEngine,
  MadagascarStarter
} from "./allowed_actions";
import {
  MadagascarBuildCostCalculator,
  MadagascarBuilderHelper,
  MadagascarBuildPhase,
  MadagascarDoneAction
} from "./build";
import {map} from "./grid";
import {MadagascarMovePassAction, MadagascarMovePhase} from "./move";
import {MadagascarTurnOrderPass, MadagascarTurnOrderPhase} from "./turn_order";
import {createElement as reactCreateElement, ReactNode} from "react";
import {Action} from "../../engine/state/action";
import {MadagascarRules} from "./rules";

export class MadagascarMapSettings implements MapSettings {
  static readonly key = 'madagascar'
  readonly key = MadagascarMapSettings.key;
  readonly name = 'Madagascar';
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
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
    ];
  }

  getMapRules(): ReactNode {
    return reactCreateElement(MadagascarRules);
  }

  getActionDescription(action: Action): string | undefined {
    if (action === Action.LOCOMOTIVE) {
      return 'Immediately, increase your locomotive by one, but you cannot build track this turn.';
    }
    if (action === Action.URBANIZATION) {
      return 'Place a new city on any town during the build step, but may only build one track tile.';
    }
    return undefined;
  }
}