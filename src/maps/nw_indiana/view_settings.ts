import { MapViewSettings } from "../view_settings";
import { NwIndianaRules } from "./rules";
import { NwIndianaMapSettings } from "./settings";

export class NwIndianaViewSettings
  extends NwIndianaMapSettings
  implements MapViewSettings
{
  getMapRules = NwIndianaRules;
}
