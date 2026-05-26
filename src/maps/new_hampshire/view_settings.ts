import { MapViewSettings } from "../view_settings";
import { NewHampshireRules } from "./rules";
import { NewHampshireMapSettings } from "./settings";

export class NewHampshireViewSettings
  extends NewHampshireMapSettings
  implements MapViewSettings
{
  getMapRules = NewHampshireRules;
}
