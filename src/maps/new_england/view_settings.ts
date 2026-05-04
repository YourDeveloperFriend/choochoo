import { MapViewSettings } from "../view_settings";
import { NewEnglandRules } from "./rules";
import { NewEnglandMapSettings } from "./settings";

export class NewEnglandViewSettings
  extends NewEnglandMapSettings
  implements MapViewSettings
{
  getMapRules = NewEnglandRules;
}
