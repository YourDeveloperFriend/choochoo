import { CyprusRules } from "./rules";
import { CyprusMapSettings } from "./settings";

export class CyprusViewSettings extends CyprusMapSettings {
  getMapRules = CyprusRules;
}