import { MapViewSettings } from "../view_settings";
import { SoulTrainRules } from "./rules";
import { SoulTrainMapSettings } from "./settings";

export class SoulTrainViewSettings
  extends SoulTrainMapSettings
  implements MapViewSettings
{
  getMapRules = SoulTrainRules;
}
