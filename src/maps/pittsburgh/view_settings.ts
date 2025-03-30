import { MapViewSettings } from "../view_settings";
import { PittsburghRules } from "./rules";
import { PittsburghMapSettings } from "./settings";

export class PittsburghViewSettings
  extends PittsburghMapSettings
  implements MapViewSettings
{
  getMapRules = PittsburghRules;
}
