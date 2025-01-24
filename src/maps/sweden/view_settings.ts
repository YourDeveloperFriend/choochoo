import {SwedenRules} from "./rules";
import {SwedenRecyclingMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";

export class SwedenRecyclingViewSettings extends SwedenRecyclingMapSettings implements MapViewSettings {
  getMapRules = SwedenRules;
}