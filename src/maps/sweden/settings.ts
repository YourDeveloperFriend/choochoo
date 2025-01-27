import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  SwedenMoveAction,
  SwedenMovePhase,
  SwedenPhaseEngine,
} from "./recycling";
import { SwedenAllowedActions } from "./recycling_score";
import { SwedenPlayerHelper } from "./score";
import { SwedenStarter } from "./starter";

export class SwedenRecyclingMapSettings implements MapSettings {
  static readonly key = GameKey.SWEDEN;
  readonly key = SwedenRecyclingMapSettings.key;
  readonly name = "Sweden Recycling";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      SwedenStarter,
      SwedenAllowedActions,
      SwedenMovePhase,
      SwedenMoveAction,
      SwedenPlayerHelper,
      SwedenPhaseEngine,
    ];
  }
}
