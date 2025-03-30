import { GameKey } from "../../api/game_key";
import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { PittsburghFunkyBuilding } from "./build_cost";
import {
  PittsburghAllowedActions,
  PittsburghBuildDiscountManager,
} from "./commonwealth";
import { map } from "./grid";

export class PittsburghMapSettings implements MapSettings {
  readonly key = GameKey.PITTSBURGH;
  readonly name = "Pittsburgh";
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      PittsburghFunkyBuilding,
      PittsburghAllowedActions,
      PittsburghBuildDiscountManager,
    ];
  }
}
