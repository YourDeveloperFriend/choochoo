import { KoreaRules } from "./rules";
import { KoreaMapSettings } from "./settings";

export class KoreaViewSettings extends KoreaMapSettings {
  getMapRules = KoreaRules;
}