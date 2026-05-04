import { MapViewSettings } from "../view_settings";
import { JamaicaRules } from "./rules";
import { JamaicaMapSettings } from "./settings";

export class JamaicaViewSettings
  extends JamaicaMapSettings
  implements MapViewSettings
{
  getMapRules = JamaicaRules;
}
