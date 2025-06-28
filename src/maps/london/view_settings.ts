import { LondonRules } from "./rules";
import { LondonMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { LondonRivers } from "./rivers";
import { Phase } from "../../engine/state/phase";
import { InstantProductionMoveGoodsActionSummary } from "../../modules/instant_production/instant_production_view";

export class LondonViewSettings
  extends LondonMapSettings
  implements MapViewSettings
{
  getMapRules = LondonRules;
  getTexturesLayer = LondonRivers;

  getActionSummary(phase: Phase) {
    if (phase === Phase.MOVING) {
      return InstantProductionMoveGoodsActionSummary;
    }
  }
}
