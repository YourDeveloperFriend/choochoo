import { GameKey } from "../../api/game_key";
import {
  JACK,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { InstantProductionModule } from "../../modules/instant_production/module";
import { TurnLengthModule } from "../../modules/turn_length";
import { interCityConnections } from "../factory";
import { LondonActionNamingProvider } from "./actions";
import { LondonAllowedActions } from "./allowed_actions";
import { LondonBuilderHelper } from "./build";
import { LondonCostCalculator } from "./cost";
import { map } from "./grid";
import { LondonPhaseEngine } from "./production";
import { LondonPlayerHelper } from "./score";
import { LondonShareHelper } from "./shares";
import { LondonStarter } from "./starter";
import { LondonUrbanizeAction } from "./urbanize";

export class LondonMapSettings implements MapSettings {
  static readonly key = GameKey.LONDON;
  readonly key = LondonMapSettings.key;
  readonly name = "London";
  readonly designer = "J. C. Lawrence";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Bloomsbury", "Shoreditch"], cost: 4 },
    { connects: ["Westminster", "Waterloo"], cost: 4 },
  ]);
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      LondonAllowedActions,
      LondonCostCalculator,
      LondonStarter,
      LondonBuilderHelper,
      LondonPhaseEngine,
      LondonShareHelper,
      LondonUrbanizeAction,
      LondonPlayerHelper,
      LondonActionNamingProvider,
    ];
  }

  getModules() {
    return [new TurnLengthModule({ add: -1 }), new InstantProductionModule()];
  }
}
