import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
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
import { MoonStarter } from "./starter";
import { getNeighbor } from "./wrap_around";
import { MoonMoveInterceptor } from "./move_interceptor";

export class MoonMapSettings implements MapSettings {
  readonly key = GameKey.MOON;
  readonly name = "Moon";
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
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
