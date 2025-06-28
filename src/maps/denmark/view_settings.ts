import { DenmarkRules } from "./rules";
import { DenmarkMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { DenmarkRivers } from "./rivers";
import { Phase } from "../../engine/state/phase";
import { InstantProductionMoveGoodsActionSummary } from "../../modules/instant_production/instant_production_view";

export class DenmarkViewSettings
  extends DenmarkMapSettings
  implements MapViewSettings
{
  getMapRules = DenmarkRules;
  getTexturesLayer = DenmarkRivers;

  getActionSummary(phase: Phase) {
    if (phase === Phase.MOVING) {
      return InstantProductionMoveGoodsActionSummary;
    }
  }
}
