import { SwedenRules } from "./rules";
import { SwedenRecyclingMapSettings } from "./settings";

export class SwedenRecyclingViewSettings extends SwedenRecyclingMapSettings {
  getMapRules = SwedenRules;
}