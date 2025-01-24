import {KoreaRules} from "./rules";
import {KoreaMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";

export class KoreaViewSettings extends KoreaMapSettings implements MapViewSettings {
  getMapRules = KoreaRules;
}