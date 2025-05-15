import { MapViewSettings } from "../view_settings";
import { ScotlandRules } from "./rules";
import { ScotlandMapSettings } from "./settings";

export class ScotlandViewSettings
  extends ScotlandMapSettings
  implements MapViewSettings
{
  getMapRules = ScotlandRules;
}
