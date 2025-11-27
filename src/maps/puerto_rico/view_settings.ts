import { MapViewSettings } from "../view_settings";
import { PuertoRicoRules } from "./rules";
import { PuertoRicoMapSettings } from "./settings";

export class PuertoRicoViewSettings
  extends PuertoRicoMapSettings
  implements MapViewSettings
{
  getMapRules = PuertoRicoRules;
}
