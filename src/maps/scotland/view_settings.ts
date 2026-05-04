import { MapViewSettings } from "../view_settings";
import { ScotlandRules } from "./rules";
import { ScotlandRivers } from "./rivers";
import { ScotlandMapSettings } from "./settings";

export class ScotlandViewSettings
  extends ScotlandMapSettings
  implements MapViewSettings
{
  getMapRules = ScotlandRules;
  getTexturesLayer = ScotlandRivers;
}
