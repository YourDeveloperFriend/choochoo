import { WyomingRules } from "./rules";
import { WyomingMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";

export class WyomingViewSettings
  extends WyomingMapSettings
  implements MapViewSettings
{
  getMapRules = WyomingRules;
}
