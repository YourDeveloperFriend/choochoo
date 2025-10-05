import { MapViewSettings } from "../view_settings";
import { SouthernUsRules } from "./rules";
import { SouthernUsMapSettings } from "./settings";

export class SouthernUsViewSettings
  extends SouthernUsMapSettings
  implements MapViewSettings
{
  getMapRules = SouthernUsRules;
}
