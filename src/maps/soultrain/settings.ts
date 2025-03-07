import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import {
  SoulTrainBuildAction,
  SoulTrainBuilderHelper,
  SoulTrainBuildPhase,
  SoulTrainCalculator,
} from "./building";
import { SoulTrainMoveAction, SoulTrainMoveHelper } from "./delivery";
import { map } from "./grid";
import {
  SoulTrainAllowedActions,
  SoulTrainPhaseDelegator,
  SoulTrainPhaseEngine,
  SoulTrainRoundEngine,
} from "./phases";
import { SoulTrainStarter } from "./starter";

export class SoulTrainMapSettings implements MapSettings {
  readonly key = GameKey.SOUL_TRAIN;
  readonly name = "Soul Train";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      SoulTrainStarter,
      SoulTrainCalculator,
      SoulTrainBuildAction,
      SoulTrainBuildPhase,
      SoulTrainPhaseEngine,
      SoulTrainPhaseDelegator,
      SoulTrainRoundEngine,
      SoulTrainMoveHelper,
      SoulTrainMoveAction,
      SoulTrainBuilderHelper,
      SoulTrainAllowedActions,
    ];
  }
}
