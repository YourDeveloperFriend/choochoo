import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Fac51AllowedActions, Fac51ActionNamingProvider } from "./actions";
import { Fac51BuildCostCalculator } from "./build";
import { Fac51GoodsGrowthPhase } from "./goods_growth";
import { map } from "./grid";
import {
  Fac51MoveAction,
  Fac51MoveHelper,
  Fac51MoveInterceptor,
  Fac51MoveSearcher,
  Fac51MoveValidator,
  Fac51PlayerHelper,
} from "./move";
import { Fac51RoundEngine } from "./round";
import { Fac51GameStarter } from "./starter";
import { Fac51UrbanizeAction } from "./urbanize";
import { Fac51StateStore } from "./state_store";

export class Fac51MapSettings implements MapSettings {
  readonly key = "fac51";
  readonly name = "FAC51";
  readonly designer = "Daniel Simpson";
  readonly implementerId = JACK;
  readonly minPlayers = 4;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.HIGHLY_RECOMMENDED,
    6: PlayerCountRating.HIGHLY_RECOMMENDED,
  };
  readonly rotation = Rotation.COUNTER_CLOCKWISE;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.PRODUCTION;

  getOverrides() {
    return [
      Fac51GameStarter,
      Fac51BuildCostCalculator,
      Fac51RoundEngine,
      Fac51AllowedActions,
      Fac51ActionNamingProvider,
      Fac51MoveHelper,
      Fac51MoveInterceptor,
      Fac51MoveValidator,
      Fac51MoveAction,
      Fac51MoveSearcher,
      Fac51PlayerHelper,
      Fac51GoodsGrowthPhase,
      Fac51UrbanizeAction,
      Fac51StateStore,
    ];
  }
}
