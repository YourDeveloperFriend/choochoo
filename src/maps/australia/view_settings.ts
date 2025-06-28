import { MapViewSettings } from "../view_settings";
import { AustraliaRules } from "./rules";
import { AustraliaMapSettings } from "./settings";

export class AustraliaViewSettings
  extends AustraliaMapSettings
  implements MapViewSettings
{
  getMapRules = AustraliaRules;
}
