import { MapViewSettings } from "../view_settings";
import { SicilyRules } from "./rules";
import { SicilyMapSettings } from "./settings";

export class SicilyViewSettings
  extends SicilyMapSettings
  implements MapViewSettings
{
  getMapRules = SicilyRules;
}
