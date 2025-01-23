import { MapSettings, ReleaseStage } from "../../engine/game/map_settings";
import { MontrealBidAction, MontrealSelectActionPhase, MontrealTurnOrderPhase } from "./auction_tweak";
import { map } from "./grid";

export class MontrealMetroMapSettings implements MapSettings {
  readonly key = 'montreal-metro';
  readonly name = 'Montreal Metro';
  readonly minPlayers = 3;
  readonly maxPlayers = 3;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.BETA;

  getOverrides() {
    return [
      MontrealSelectActionPhase,
      MontrealBidAction,
      MontrealTurnOrderPhase,
    ];
  }
}
