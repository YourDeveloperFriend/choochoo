import {
  JACK,
  JUICE,
  MapSettings,
  PlayerCountRating,
  ReleaseStage,
  Rotation,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { ClaimRequiresUrbanizeModule } from "../../modules/claim_requires_urbanize";
import { NwIndianaProfitHelper } from "./expenses";
import { map } from "./grid";
import { NwIndianaMoveHelper } from "./move";
import { NwIndianaShareHelper } from "./shares";

export class NwIndianaMapSettings implements MapSettings {
  readonly key = "nw-indiana";
  readonly name = "NW Indiana";
  readonly designer = "Justin Szczepanski";
  readonly implementerId = JACK;
  readonly minPlayers = 4;
  readonly maxPlayers = 6;
  readonly playerCountRatings = {
    1: PlayerCountRating.NOT_SUPPORTED,
    2: PlayerCountRating.NOT_SUPPORTED,
    3: PlayerCountRating.NOT_SUPPORTED,
    4: PlayerCountRating.NO_DATA,
    5: PlayerCountRating.NO_DATA,
    6: PlayerCountRating.NO_DATA,
    7: PlayerCountRating.NOT_SUPPORTED,
    8: PlayerCountRating.NOT_SUPPORTED,
  };
  readonly startingGrid = map;
  readonly rotation = Rotation.COUNTER_CLOCKWISE;
  readonly stage = ReleaseStage.DEVELOPMENT;
  readonly developmentAllowlist = [JACK, JUICE];

  getOverrides() {
    return [NwIndianaMoveHelper, NwIndianaProfitHelper, NwIndianaShareHelper];
  }

  getModules(): Array<Module> {
    return [new ClaimRequiresUrbanizeModule()];
  }
}
