import {
  JACK,
  JUICE,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import {
  OahuActionNamingProvider,
  OahuAllowedActions,
  OahuSelectAction,
} from "./actions";
import { OahuBuildCostCalculator, OahuValidator } from "./build";
import { map } from "./grid";
import { OahuMoveHelper } from "./move";
import { OahuGoodsGrowthPhase, OahuProductionAction } from "./production";
import { OahuStarter } from "./starter";

export class OahuMapSettings implements MapSettings {
  readonly key = "oahu";
  readonly name = "O'ahu";
  readonly designer = "Justin Szczepanski";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NO_DATA,
    4: PlayerCountRating.NO_DATA,
    5: PlayerCountRating.NO_DATA,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, JUICE];

  getOverrides() {
    return [
      OahuStarter,
      OahuAllowedActions,
      OahuActionNamingProvider,
      OahuSelectAction,
      OahuBuildCostCalculator,
      OahuValidator,
      OahuMoveHelper,
      OahuGoodsGrowthPhase,
      OahuProductionAction,
    ];
  }
}
