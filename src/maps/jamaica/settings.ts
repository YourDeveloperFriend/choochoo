import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { JamaicaAllowedActions } from "./allowed_actions";
import { JamaicaPhaseEngine, stLuciaModule } from "./bidding";
import { JamaicaRoundEngine } from "./end_game";
import { map } from "./grid";
import { JamaicaGoodsGrowthPhase, JamaicaProductionAction } from "./production";
import { JamaicaStarter } from "./pure_cubes";

export class JamaicaMapSettings implements MapSettings {
  readonly key = GameKey.JAMAICA;
  readonly name = "Jamaica";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 2;
  readonly maxPlayers = 2;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.HIGHLY_RECOMMENDED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      JamaicaAllowedActions,
      JamaicaStarter,
      JamaicaPhaseEngine,
      JamaicaRoundEngine,
      JamaicaProductionAction,
      JamaicaGoodsGrowthPhase,
      ...stLuciaModule,
    ];
  }
}
