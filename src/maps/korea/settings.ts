import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { KoreaCostCalculator } from "./cost";
import { map } from "./grid";
import { KoreaMoveHelper } from "./move";
import { KoreaStarter } from "./starter";
import { KoreaUrbanizeAction } from "./urbanize";

export class KoreaMapSettings implements MapSettings {
  static readonly key = GameKey.KOREA;
  readonly key = KoreaMapSettings.key;
  readonly name = "Korea";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    ["Inchon", "Suwon"],
    ["Suwon", "Seoul"],
  ]);
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      KoreaUrbanizeAction,
      KoreaCostCalculator,
      KoreaStarter,
      KoreaMoveHelper,
    ];
  }
}
