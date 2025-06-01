import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import {
  GermanyBuildAction,
  GermanyBuilderHelper,
  GermanyBuildPhase,
} from "./build";
import { GermanyCostCalculator } from "./cost";
import { map } from "./grid";
import { GermanyMoveHelper } from "./move";
import { GermanyStarter } from "./starter";

export class GermanyMapSettings implements MapSettings {
  static readonly key = GameKey.GERMANY;
  readonly key = GermanyMapSettings.key;
  readonly name = "Germany";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Düsseldorf", "Essen"] },
  ]);
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      GermanyCostCalculator,
      GermanyMoveHelper,
      GermanyStarter,
      GermanyBuilderHelper,
      GermanyBuildAction,
      GermanyBuildPhase,
    ];
  }
}
