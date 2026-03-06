import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { EngineerFreeBuildModule } from "../../modules/engineer_free_build";
import { UrbanizationUsesBuildModule } from "../../modules/urbanization_uses_build";
import { map } from "./grid";
import { AustraliaMoveAction } from "./perth";
import { AustraliaStarter } from "./starter";
import { AustraliaActionNamingProvider } from "./actions";

export class AustraliaMapSettings implements MapSettings {
  readonly key = GameKey.AUSTRALIA;
  readonly name = "Australia";
  readonly designer = "Ted Alspach";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 4;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.RECOMMENDED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      AustraliaStarter,
      AustraliaMoveAction,
      AustraliaActionNamingProvider,
    ];
  }

  getModules(): Array<Module> {
    return [new EngineerFreeBuildModule(), new UrbanizationUsesBuildModule()];
  }
}
