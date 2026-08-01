import { MapViewSettings } from "../view_settings";
import { NwIndianaRules } from "./rules";
import { NwIndianaMapSettings } from "./settings";
import { NwIndianaOverlayLayer } from "./rivers";

export class NwIndianaViewSettings
  extends NwIndianaMapSettings
  implements MapViewSettings
{
  getMapRules = NwIndianaRules;
  getOverlayLayer = NwIndianaOverlayLayer;
}
