import { MapViewSettings } from "../view_settings";
import { ScandinaviaRivers } from "./rivers";
import { ScandinaviaRules } from "./rules";
import { ScandinaviaMapSettings } from "./settings";

export class ScandinaviaViewSettings
  extends ScandinaviaMapSettings
  implements MapViewSettings
{
  getMapRules = ScandinaviaRules;

  getTexturesLayer = ScandinaviaRivers;
}
