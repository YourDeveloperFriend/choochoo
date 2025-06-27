import { LondonRules } from "./rules";
import { LondonMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { LondonRivers } from "./rivers";
import { MoveGoodsActionSummary } from "./instant_production_view";
import { Phase } from "../../engine/state/phase";

export class LondonViewSettings
  extends LondonMapSettings
  implements MapViewSettings
{
  getMapRules = LondonRules;
  getTexturesLayer = LondonRivers;

  getActionSummary(phase: Phase) {
    if (phase === Phase.MOVING) {
      return MoveGoodsActionSummary;
    }
  }
}
