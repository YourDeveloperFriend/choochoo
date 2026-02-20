import { MapViewSettings } from "../view_settings";
import { SouthernUsRules } from "./rules";
import { SouthernUsMapSettings } from "./settings";
import { SouthernUSRivers } from "./rivers";

export class SouthernUsViewSettings
  extends SouthernUsMapSettings
  implements MapViewSettings
{
  getMapRules = SouthernUsRules;
  getTexturesLayer = SouthernUSRivers;
}
