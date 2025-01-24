import {CyprusRules} from "./rules";
import {CyprusMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";

export class CyprusViewSettings extends CyprusMapSettings implements MapViewSettings {
  getMapRules = CyprusRules;
}