import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import {
  DiscoLoco,
  DiscoMoveAction,
  DiscoMoveHelper,
  DiscoMovePhase,
} from "./deliver";
import { map } from "./grid";
import {
  DiscoPhaseDelegator,
  DiscoPhaseEngine,
  DiscoProductionPhase,
} from "./production";
import { DiscoStarter } from "./starter";

export class DiscoInfernoMapSettings implements MapSettings {
  static readonly key = GameKey.DISCO_INFERNO;
  readonly key = DiscoInfernoMapSettings.key;
  readonly name = "Disco Inferno";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      DiscoStarter,
      DiscoPhaseEngine,
      DiscoPhaseDelegator,
      DiscoProductionPhase,
      DiscoMoveAction,
      DiscoMoveHelper,
      DiscoMovePhase,
      DiscoLoco,
    ];
  }
}
