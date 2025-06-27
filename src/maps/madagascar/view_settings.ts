import { MapViewSettings } from "../view_settings";
import { getActionCaption } from "./action_caption";
import { MadagascarRules } from "./rules";
import { MadagascarMapSettings } from "./settings";

export class MadagascarViewSettings
  extends MadagascarMapSettings
  implements MapViewSettings
{
  getMapRules = MadagascarRules;

  getActionCaption = getActionCaption;
}
