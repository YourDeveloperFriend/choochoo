import {RustBeltMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";
import {RustBeltRivers} from "./rivers";

export class RustBeltViewSettings extends RustBeltMapSettings implements MapViewSettings {
  getTexturesLayer = RustBeltRivers;

  getMapRules() {
    return null;
  }
}