import {
  ReversteamVariantConfig,
  VariantConfig,
} from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { ReversteamRivers } from "./rivers";
import { ReversteamRules } from "./rules";
import { REVERSTEAM_GAME_KEY, ReversteamMapSettings } from "./settings";
import { ReversteamVariantEditor } from "./variant_editor";

export class ReversteamViewSettings
  extends ReversteamMapSettings
  implements MapViewSettings
{
  getTexturesLayer = ReversteamRivers;

  getInitialVariantConfig(): VariantConfig {
    return { gameKey: REVERSTEAM_GAME_KEY, baseRules: false };
  }
  getVariantConfigEditor = ReversteamVariantEditor;

  getMapRules = ReversteamRules;

  getVariantString(variant: VariantConfig): string[] | undefined {
    if ((variant as ReversteamVariantConfig).baseRules) {
      return ["Base rules"];
    }
  }
}
