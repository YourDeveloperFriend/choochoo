import { MapViewSettings } from "../view_settings";
import { StLuciaRivers } from "./rivers";
import { StLuciaRules } from "./rules";
import { StLuciaMapSettings } from "./settings";

export class StLuciaViewSettings
  extends StLuciaMapSettings
  implements MapViewSettings
{
  getTexturesLayer = StLuciaRivers;

  getMapRules = StLuciaRules;
}
