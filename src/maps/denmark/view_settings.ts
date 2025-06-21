import { DenmarkRules } from "./rules";
import { DenmarkMapSettings } from "./settings";
import { MapViewSettings } from "../view_settings";
import { DenmarkRivers } from "./rivers";

export class DenmarkViewSettings
  extends DenmarkMapSettings
  implements MapViewSettings
{
  getMapRules = DenmarkRules;
  getTexturesLayer = DenmarkRivers;
}
