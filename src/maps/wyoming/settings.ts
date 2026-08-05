import {
  JACK,
  JUICE,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { Action } from "../../engine/state/action";
import { AvailableActionsModule } from "../../modules/available_actions";
import { WyomingActionNamingProvider } from "./actions";
import { WyomingAllowedActions } from "./allowed_actions";
import { WyomingBuildCostCalculator } from "./cost";
import { WyomingDiscountManager } from "./engineer";
import { WyomingGoodsGrowthPhase } from "./goods_growth";
import { map } from "./grid";
import { WyomingMoveHelper, WyomingSelectAction } from "./locomotive";
import { WyomingRoundEngine } from "./round";
import { WyomingSharesPhase } from "./shares";
import { WyomingStarter } from "./starter";
import { WyomingUrbanizeAction } from "./urbanize";

export class WyomingMapSettings implements MapSettings {
  readonly key = "wyoming";
  readonly name = "Wyoming";
  readonly designer = "Justin Szczepanski";
  readonly implementerId = JACK;
  readonly minPlayers = 2;
  readonly maxPlayers = 3;

  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NO_DATA,
    3: PlayerCountRating.NO_DATA,
    4: PlayerCountRating.NOT_SUPPORTED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly rotation = Rotation.COUNTER_CLOCKWISE;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, JUICE];

  getOverrides() {
    return [
      WyomingAllowedActions,
      WyomingStarter,
      WyomingRoundEngine,
      WyomingBuildCostCalculator,
      WyomingUrbanizeAction,
      WyomingGoodsGrowthPhase,
      WyomingSharesPhase,
      WyomingDiscountManager,
      WyomingSelectAction,
      WyomingMoveHelper,
      WyomingActionNamingProvider,
    ];
  }

  getModules(): Module[] {
    return [new AvailableActionsModule({ remove: [Action.TURN_ORDER_PASS] })];
  }
}
