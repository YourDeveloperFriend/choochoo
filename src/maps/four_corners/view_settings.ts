import { MapViewSettings } from "../view_settings";
import { FourCornersRules } from "./rules";
import { FourCornersMapSettings } from "./settings";
import { FourCornersRivers } from "./rivers";

export class FourCornersViewSettings
  extends FourCornersMapSettings
  implements MapViewSettings
{
  getMapRules = FourCornersRules;
  getTexturesLayer = FourCornersRivers;
}
