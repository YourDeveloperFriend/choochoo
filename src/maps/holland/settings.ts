import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { HollandAllowedActions } from "./allowed_actions";
import { HollandBuildCostCalculator, HollandBuildValidator } from "./build";
import { map } from "./grid";
import { HollandStarter } from "./starter";
import { HollandVariantConfig } from "./variant_config";

export class HollandMapSettings implements MapSettings {
  readonly key = "holland";
  readonly name = "Holland";
  readonly designer = "Alban Viard";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 4;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.NOT_SUPPORTED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly rotation = Rotation.COUNTER_CLOCKWISE;
  readonly stage = ReleaseStage.ALPHA;
  readonly variantConfig = HollandVariantConfig;

  getOverrides() {
    return [
      HollandAllowedActions,
      HollandStarter,
      HollandBuildValidator,
      HollandBuildCostCalculator,
    ];
  }
}
