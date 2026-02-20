import { GameKey } from "../../api/game_key";
import {
  EMIL,
  MapSettings,
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
