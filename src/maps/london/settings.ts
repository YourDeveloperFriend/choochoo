import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { LondonBuilderHelper } from "./build";
import { LondonCostCalculator } from "./cost";
import { map } from "./grid";
import { LondonStarter } from "./starter";
import { LondonAllowedActions } from "./allowed_actions";
import { LondonPhaseEngine } from "./production";
import { LondonShareHelper } from "./shares";
import { LondonUrbanizeAction } from "./urbanize";
import { LondonPlayerHelper } from "./score";
import { TurnLengthModule } from "../../modules/turn_length";
import { InstantProductionModule } from "../../modules/instant_production/module";

export class LondonMapSettings implements MapSettings {
  static readonly key = GameKey.LONDON;
  readonly key = LondonMapSettings.key;
  readonly name = "London";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Bloomsbury", "Shoreditch"], cost: 4 },
    { connects: ["Westminster", "Waterloo"], cost: 4 },
  ]);
  readonly stage = ReleaseStage.ALPHA;

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
    ];
  }

  getModules() {
    return [new TurnLengthModule({ add: -1 }), new InstantProductionModule()];
  }
}
