import { MapViewSettings } from "../view_settings";
import { WyomingRules } from "./rules";
import { WyomingMapSettings } from "./settings";

export class WyomingViewSettings
  extends WyomingMapSettings
  implements MapViewSettings
{
  getMapRules = WyomingRules;
}
