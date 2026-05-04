import { MapViewSettings } from "../view_settings";
import { TTTCAMEL_CASERules } from "./rules";
import { TTTCAMEL_CASEMapSettings } from "./settings";

export class TTTCAMEL_CASEViewSettings
  extends TTTCAMEL_CASEMapSettings
  implements MapViewSettings
{
  getMapRules = TTTCAMEL_CASERules;
}
