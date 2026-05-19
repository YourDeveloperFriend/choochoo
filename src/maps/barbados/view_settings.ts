import { MapViewSettings } from "../view_settings";
import { BarbadosRules } from "./rules";
import { BarbadosMapSettings } from "./settings";

export class BarbadosViewSettings
  extends BarbadosMapSettings
  implements MapViewSettings
{
  getMapRules = BarbadosRules;
  hideScoreBreakdown = true; // Barbados uses money-as-score for solo play, not VPs
}
