import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import {
  BarbadosActions,
  BarbadosSelectAction,
  BarbadosSelectActionPhase,
} from "./actions";
import { BarbadosGameEnd, BarbadosPlayerHelper } from "./game_end";
import { map } from "./grid";
import { BarbadosGoodsGrowthPhase } from "./growth";
import { BarbadosStarter } from "./setup";
import { BarbadosTakeSharesAction } from "./shares";

export class BarbadosMapSettings implements MapSettings {
  readonly key = GameKey.BARBADOS;
  readonly name = "Barbados";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 1;
  readonly maxPlayers = 1;
  readonly playerCountRatings = {
    1: PlayerCountRating.HIGHLY_RECOMMENDED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      BarbadosStarter,
      BarbadosTakeSharesAction,
      BarbadosSelectAction,
      BarbadosActions,
      BarbadosSelectActionPhase,
      BarbadosGoodsGrowthPhase,
      BarbadosGameEnd,
      BarbadosPlayerHelper,
    ];
  }

  getModules(): Array<Module> {
    return [new TurnLengthModule({ turnLength: 10 })];
  }
}
