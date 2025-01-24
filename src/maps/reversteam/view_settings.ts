import {ReversteamMapSettings} from "./settings";
import {MapViewSettings} from "../view_settings";
import {ReversteamRivers} from "./rivers";

export class ReversteamViewSettings extends ReversteamMapSettings implements MapViewSettings {
  getTexturesLayer = ReversteamRivers;

  getMapRules() {
    return null;
  }
}