import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
  PlayerCountRating,
} from "../../engine/game/map_settings";
import { interCityConnections } from "../factory";
import { KoreaWallaceCostCalculator } from "./cost";
import { map } from "./grid";
import { KoreaWallaceMoveHelper } from "./move";
import { KoreaWallaceStarter } from "./starter";
import { KoreaWallaceUrbanizeAction } from "./urbanize";

export class KoreaWallaceMapSettings implements MapSettings {
  static readonly key = GameKey.KOREA_WALLACE;
  readonly key = KoreaWallaceMapSettings.key;
  readonly name = "Korea";
  readonly designer = "Martin Wallace";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.HIGHLY_RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.MIXED,
    6: PlayerCountRating.MIXED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
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
