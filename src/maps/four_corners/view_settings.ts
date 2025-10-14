import { MapViewSettings } from "../view_settings";
import { FourCornersRules } from "./rules";
import { FourCornersMapSettings } from "./settings";

export class FourCornersViewSettings
  extends FourCornersMapSettings
  implements MapViewSettings
{
  getMapRules = FourCornersRules;
}
