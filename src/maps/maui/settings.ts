import { Action } from "../../engine/state/action";
import {
  JACK,
  JUICE,
  Rotation,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { AvailableActionsModule } from "../../modules/available_actions";
import { MauiActionNamingProvider, COASTAL_ENGINEER } from "./actions";
import {
  MauiBuildAction,
  MauiBuildCostCalculator,
  MauiBuildPhase,
  MauiBuilderHelper,
  MauiDiscountManager,
  MauiValidator,
} from "./build";
import { MauiMoveAction, MauiMoveHelper, MauiMoveValidator } from "./move";
import {
  MauiPlayerHelper,
  MauiShareHelper,
  MauiTakeSharesAction,
} from "./shares";
import { map } from "./grid";
import { MauiGoodsGrowthPhase } from "./goods_growth";
import { MauiGameStarter } from "./starter";

export class MauiMapSettings implements MapSettings {
  readonly key = "maui";
  readonly name = "Maui";
  readonly designer = "Justin Szczepanski";
  readonly implementerId = JACK;
  readonly rotation = Rotation.COUNTER_CLOCKWISE;
  readonly minPlayers = 4;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NO_DATA,
    5: PlayerCountRating.NO_DATA,
    6: PlayerCountRating.NO_DATA,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, JUICE];

  getOverrides() {
    return [
      MauiActionNamingProvider,
      MauiBuildCostCalculator,
      MauiBuilderHelper,
      MauiDiscountManager,
      MauiBuildAction,
      MauiBuildPhase,
      MauiValidator,
      MauiMoveHelper,
      MauiMoveAction,
      MauiMoveValidator,
      MauiShareHelper,
      MauiTakeSharesAction,
      MauiPlayerHelper,
      MauiGoodsGrowthPhase,
      MauiGameStarter,
    ];
  }

  getModules(): Array<Module> {
    // No Production. The base Engineer slot is the National Parkway Engineer, and the Coastal Engineer is added.
    return [
      new AvailableActionsModule({
        remove: [Action.PRODUCTION],
        add: [COASTAL_ENGINEER],
      }),
    ];
  }
}
