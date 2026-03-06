import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { PittsburghBuilderHelper, PittsburghFunkyBuilding } from "./build_cost";
import {
  PittsburghAllowedActions,
  PittsburghBuildDiscountManager,
} from "./commonwealth";
import { map } from "./grid";
import { PittsburghRoundEngine } from "./shorter_game";

export class PittsburghMapSettings implements MapSettings {
  readonly key = GameKey.PITTSBURGH;
  readonly name = "Pittsburgh";
  readonly designer = "John Bohrer";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.HIGHLY_RECOMMENDED,
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
      PittsburghBuilderHelper,
      PittsburghFunkyBuilding,
      PittsburghAllowedActions,
      PittsburghBuildDiscountManager,
      PittsburghRoundEngine,
    ];
  }
}
