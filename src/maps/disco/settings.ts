import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
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
import { DiscoActionNamingProvider } from "./actions";

export class DiscoInfernoMapSettings implements MapSettings {
  static readonly key = GameKey.DISCO_INFERNO;
  readonly key = DiscoInfernoMapSettings.key;
  readonly name = "Disco Inferno";
  readonly designer = "Ted Alspach";
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
      DiscoActionNamingProvider,
    ];
  }
}
