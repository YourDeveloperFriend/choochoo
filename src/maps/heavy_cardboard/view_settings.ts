import { MapViewSettings } from "../view_settings";
import { HeavyCardboardOverlayLayer, HeavyCardboardRivers } from "./rivers";
import { HeavyCardboardRules } from "./rules";
import { HeavyCardboardMapSettings } from "./settings";

export class HeavyCardboardViewSettings
  extends HeavyCardboardMapSettings
  implements MapViewSettings
{
  getMapRules = HeavyCardboardRules;
  getTexturesLayer = HeavyCardboardRivers;
  getOverlayLayer = HeavyCardboardOverlayLayer;
}
