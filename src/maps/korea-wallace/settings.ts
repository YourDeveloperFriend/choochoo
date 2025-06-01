import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { KoreaWallaceCostCalculator } from "./cost";
import { map } from "./grid";
import { KoreaWallaceMoveHelper } from "./move";
import { KoreaWallaceStarter } from "./starter";
import { KoreaWallaceUrbanizeAction } from "./urbanize";

export class KoreaWallaceMapSettings implements MapSettings {
  static readonly key = GameKey.KOREA_WALLACE;
  readonly key = KoreaWallaceMapSettings.key;
  readonly name = "Korea (Wallace)";
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly interCityConnections = interCityConnections(map, [
    { connects: ["Inchon", "Suwon"] },
    { connects: ["Suwon", "Seoul"] },
  ]);
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      KoreaWallaceUrbanizeAction,
      KoreaWallaceCostCalculator,
      KoreaWallaceStarter,
      KoreaWallaceMoveHelper,
    ];
  }
}
