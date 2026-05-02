import {
  PuertoRicoVariantConfig,
  VariantConfig,
} from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { PuertoRicoRules } from "./rules";
import { PUERTO_RICO_GAME_KEY, PuertoRicoMapSettings } from "./settings";
import { PuertoRicoVariantEditor } from "./variant_editor";

export class PuertoRicoViewSettings
  extends PuertoRicoMapSettings
  implements MapViewSettings
{
  getMapRules = PuertoRicoRules;

  getInitialVariantConfig(): VariantConfig {
    return { gameKey: PUERTO_RICO_GAME_KEY, difficulty: "versado" };
  }

  getVariantConfigEditor = PuertoRicoVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const difficulty = (variant as PuertoRicoVariantConfig).difficulty;
    return [difficulty.charAt(0).toUpperCase() + difficulty.slice(1)];
  }
}
export const viewSettings = new PuertoRicoViewSettings();
