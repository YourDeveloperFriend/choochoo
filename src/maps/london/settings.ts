import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { LondonBuilderHelper } from "./build";
import { LondonCostCalculator } from "./cost";
import { map } from "./grid";
import { LondonStarter } from "./starter";
import { LondonAllowedActions } from "./allowed_actions";
import { LondonPhaseEngine } from "./production";
import { LondonMoveInterceptor } from "./move_interceptor";
import { LondonMoveAction } from "./move_good";
import { LondonRoundEngine } from "./shorter_game";
import { LondonShareHelper } from "./shares";
import { LondonUrbanizeAction } from "./urbanize";
import { LondonPlayerHelper } from "./score";

export class LondonMapSettings implements MapSettings {
  static readonly key = GameKey.LONDON;
  readonly key = LondonMapSettings.key;
  readonly name = "London";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    ["Bloomsbury", "Shoreditch", 4],
    ["Westminster", "Waterloo", 4],
  ]);
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      LondonAllowedActions,
      LondonCostCalculator,
      LondonStarter,
      LondonBuilderHelper,
      LondonPhaseEngine,
      LondonMoveInterceptor,
      LondonMoveAction,
      LondonRoundEngine,
      LondonShareHelper,
      LondonUrbanizeAction,
      LondonPlayerHelper,
    ];
  }
}
