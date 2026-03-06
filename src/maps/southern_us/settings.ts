import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import {
  SouthernUSMoveAction,
} from "./move";
import { SouthernUSGoodsGrowthPhase } from "./goods_growth";
import { SouthernUSIncomeReductionPhase } from "./income";
import { SouthernUSStarter } from "./starter";

export class SouthernUsMapSettings implements MapSettings {
  readonly key = GameKey.SOUTHERN_US;
  readonly name = "Southern US";
  readonly designer = "John Bohrer";
  readonly implementerId = EMIL;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly bestAt = "4-5";
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.HIGHLY_RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      SouthernUSMoveAction,
      SouthernUSGoodsGrowthPhase,
      SouthernUSIncomeReductionPhase,
      SouthernUSStarter
    ];
  }
}
