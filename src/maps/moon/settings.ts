import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { MoonBuildAction, MoonBuildHelper } from "./builds";
import {
  MoonGoodsGrowthPhase,
  MoonGoodsHelper,
  MoonMoveHelper,
  MoonRoundEngine,
  MoonUrbanizeAction,
} from "./day_night";
import { map } from "./grid";
import { MoonAllowedActions, MoonMoveAction } from "./low_gravitation";
import { MoonMoveInterceptor } from "./move_interceptor";
import { MoonStarter } from "./starter";
import { getNeighbor } from "./wrap_around";

export class MoonMapSettings implements MapSettings {
  readonly key = GameKey.MOON;
  readonly name = "Moon";
  readonly designer = "Alban Viard";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      MoonStarter,
      MoonRoundEngine,
      MoonMoveHelper,
      MoonBuildAction,
      MoonBuildHelper,
      MoonGoodsHelper,
      MoonGoodsGrowthPhase,
      MoonMoveAction,
      MoonAllowedActions,
      MoonUrbanizeAction,
      MoonMoveInterceptor,
    ];
  }

  getNeighbor = getNeighbor;
}
