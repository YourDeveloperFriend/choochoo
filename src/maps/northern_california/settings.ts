import {
  JACK,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { NorthernCaliforniaMoveAction } from "./deliver";
import { map } from "./grid";
import {
  NorthernCaliforniaMoveHelper,
  NorthernCaliforniaMoveValidator,
} from "./san_jose";
import { NorthernCaliforniaStarter } from "./starter";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { Module } from "../../engine/module/module";

export class NorthernCaliforniaMapSettings implements MapSettings {
  readonly key = "northern-california";
  readonly name = "Northern California";
  readonly designer = "Ted Alspach";
  readonly implementerId = JACK;
  readonly minPlayers = 3;
  readonly maxPlayers = 5;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.RECOMMENDED,
    4: PlayerCountRating.HIGHLY_RECOMMENDED,
    5: PlayerCountRating.RECOMMENDED,
    6: PlayerCountRating.NOT_SUPPORTED,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;

  getOverrides() {
    return [
      NorthernCaliforniaStarter,
      NorthernCaliforniaMoveAction,
      NorthernCaliforniaMoveValidator,
      NorthernCaliforniaMoveHelper,
    ];
  }
  getModules(): Array<Module> {
    return [new ClaimRequiresUrbanizeModule()];
  }
}
