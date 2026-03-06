import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { map } from "./grid";
import { DCMoveAction, DCMoveValidator } from "./move";
import { DcMoveInterceptor } from "./move_interceptor";
import { DCSelectAction, DCSelectActionPhase } from "./production";

export class DCMetroMapSettings implements MapSettings {
  readonly key = GameKey.DC_METRO;
  readonly name = "D.C. Metro";
  readonly designer = "Dylan D. Phillips";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
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
      DCSelectActionPhase,
      DCSelectAction,
      DCMoveValidator,
      DCMoveAction,
      DcMoveInterceptor,
    ];
  }

  getModules(): Array<Module> {
    return [
      new TurnLengthModule({
        function: (playerCount) => (playerCount === 3 ? 9 : 8),
      }),
    ];
  }
}
