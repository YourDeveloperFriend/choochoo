import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { map } from "./grid";
import { interCityConnections } from "../factory";
import { DoubleBaseUsaStarter } from "./starter";
import {
  DoubleBaseUsaActionNamingProvider,
  DoubleBaseUsaAllowedActions,
} from "./allowed_actions";
import { DoubleBaseUsaSelectAction } from "./select_action";
import { DoubleBaseUsaLocoAction } from "./loco";
import { DoubleBaseUsaShareHelper } from "./shares";
import { DoubleBaseUsaIncomeReductionPhase } from "./income";
import {
  DoubleBaseUsaBuildAction,
  DoubleBaseUsaBuilderHelper,
  DoubleBaseUsaBuildValidator,
  DoubleBaseUsaConnectCitiesAction,
  DoubleBaseUsaCostCalculator,
} from "./build";
import { DoubleBaseUsaSelectActionPhase } from "./production";
import {
  DoubleBaseUsaMoveAction,
  DoubleBaseUsaMoveHelper,
  DoubleBaseUsaMovePhase,
} from "./move";
import { Direction } from "../../engine/state/tile";
import { DoubleBaseUsaRoundEngine } from "./rounds";
import { DoubleBaseUsaBuildPhase } from "./starting_city";
import { DoubleBaseUsaUrbanizeAction } from "./urbanize";

export class DoubleBaseUsaMapSettings implements MapSettings {
  readonly key = GameKey.DOUBLE_BASE_USA;
  readonly name = "Double Base USA";
  readonly designer = "Kevin McCurdy";
  readonly implementerId = JACK;
  readonly minPlayers = 4;
  readonly maxPlayers = 8;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
    {
      connects: ["Philadelphia", "New York City"],
      cost: 3,
      center: [28, 7],
      offset: { direction: Direction.BOTTOM_LEFT, distance: 0.7 },
    },
    {
      connects: ["Philadelphia", "New York City"],
      cost: 6,
      center: [27, 8],
      offset: { direction: Direction.TOP_RIGHT, distance: 0.7 },
    },
  ]);

  getOverrides() {
    return [
      DoubleBaseUsaStarter,
      DoubleBaseUsaAllowedActions,
      DoubleBaseUsaActionNamingProvider,
      DoubleBaseUsaSelectAction,
      DoubleBaseUsaLocoAction,
      DoubleBaseUsaShareHelper,
      DoubleBaseUsaIncomeReductionPhase,
      DoubleBaseUsaBuilderHelper,
      DoubleBaseUsaCostCalculator,
      DoubleBaseUsaSelectAction,
      DoubleBaseUsaSelectActionPhase,
      DoubleBaseUsaBuildAction,
      DoubleBaseUsaBuildValidator,
      DoubleBaseUsaConnectCitiesAction,
      DoubleBaseUsaMovePhase,
      DoubleBaseUsaMoveAction,
      DoubleBaseUsaMoveHelper,
      DoubleBaseUsaRoundEngine,
      DoubleBaseUsaBuildPhase,
      DoubleBaseUsaUrbanizeAction,
    ];
  }
}
