import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { CyprusAllowedActions } from "./limitted_selection";
import { CyprusMoveAction } from "./move_goods";
import { CyprusCostCalculator, ShortBuild } from "./short_build";
import { CyprusStarter } from "./starter";

export class CyprusMapSettings implements MapSettings {
  static readonly key = GameKey.CYPRUS;
  readonly key = CyprusMapSettings.key;
  readonly name = "Cyprus";
  readonly designer = "Alban Viard";
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
      CyprusAllowedActions,
      ShortBuild,
      CyprusStarter,
      CyprusMoveAction,
      CyprusCostCalculator,
    ];
  }
}
