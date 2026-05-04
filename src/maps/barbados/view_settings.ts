import { MapViewSettings } from "../view_settings";
import { BarbadosRules } from "./rules";
import { BarbadosMapSettings } from "./settings";

export class BarbadosViewSettings
  extends BarbadosMapSettings
  implements MapViewSettings
{
  getMapRules = BarbadosRules;
}
