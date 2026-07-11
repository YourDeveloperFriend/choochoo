import { LondonRules } from "./rules";
import { LondonMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { LondonRivers } from "./rivers";
import { Phase } from "../../engine/state/phase";
import { InstantProductionMoveGoodsActionSummary } from "../../modules/instant_production/instant_production_view";
import { LIGHT_PLAIN, LIGHT_RIVER } from "./grid";
import * as styles from "./london.module.css";

export class LondonViewSettings
  extends LondonMapSettings
  implements MapViewSettings
{
  getMapRules = LondonRules;
  getTexturesLayer = LondonRivers;

  getLandStyles = () => ({
    [LIGHT_PLAIN]: styles.light_plain,
    [LIGHT_RIVER]: styles.light_river,
  });

  getActionSummary(phase: Phase) {
    if (phase === Phase.MOVING) {
      return InstantProductionMoveGoodsActionSummary;
    }
  }
}
