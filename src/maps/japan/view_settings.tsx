import { MapViewSettings } from "../view_settings";
import { JapanRivers } from "./rivers";
import { JapanMapSettings } from "./settings";
import { JapanRules } from "./rules";
import * as hexStyles from "../../client/grid/hex.module.css";
import { WATER_CROSSING_STYLE } from "./grid";

export class JapanViewSettings
  extends JapanMapSettings
  implements MapViewSettings
{
  getMapRules = JapanRules;
  getTexturesLayer = JapanRivers;

  getLandStyles = () => ({
    [WATER_CROSSING_STYLE]: hexStyles.water,
  });
}
