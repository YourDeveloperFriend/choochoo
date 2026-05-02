import { MapViewSettings } from "../view_settings";
import { JapanRivers } from "./rivers";
import { JapanMapSettings } from "./settings";
import { JapanRules } from "./rules";

export class JapanViewSettings
  extends JapanMapSettings
  implements MapViewSettings
{
  getMapRules = JapanRules;
  getTexturesLayer = JapanRivers;
}
export const viewSettings = new JapanViewSettings();
