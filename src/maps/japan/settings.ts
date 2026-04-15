import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { JapanMoveHelper, JapanSelectAction } from "./locomotive";
import { JapanBuilderHelper, JapanUrbanizeAction } from "./urbanize";
import { JapanBuildCostCalculator, JapanBuildValidator } from "./build";
import {JapanActionNamingProvider} from "./actions";

export class JapanMapSettings implements MapSettings {
  readonly key = GameKey.JAPAN;
  readonly name = "Japan";
  readonly designer = "Richard Irving";
  readonly implementerId = JACK;
  readonly rotation = Rotation.CLOCKWISE;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly bestAt = "3-4";
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
      JapanSelectAction,
      JapanMoveHelper,
      JapanUrbanizeAction,
      JapanBuilderHelper,
      JapanBuildValidator,
      JapanBuildCostCalculator,
      JapanActionNamingProvider,
    ];
  }
}
