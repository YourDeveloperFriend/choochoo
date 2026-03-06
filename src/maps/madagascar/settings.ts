import { GameKey } from "../../api/game_key";
import { SimpleConstructor } from "../../engine/framework/dependency_stack";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  Rotation,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { MadagascarActionNamingProvider } from "./actions";
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

export class MadagascarMapSettings implements MapSettings {
  static readonly key = GameKey.MADAGASCAR;
  readonly key = MadagascarMapSettings.key;
  readonly name = "Madagascar";
  readonly designer = "Alban Viard";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.HIGHLY_RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
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
