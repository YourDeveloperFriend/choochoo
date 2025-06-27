import { GermanyRules } from "./rules";
import { GermanyMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { GermanyRivers } from "./rivers";

export class GermanyViewSettings
  extends GermanyMapSettings
  implements MapViewSettings
{
  getMapRules = GermanyRules;
  getTexturesLayer = GermanyRivers;
}
