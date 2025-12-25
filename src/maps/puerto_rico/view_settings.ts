import { GameKey } from "../../api/game_key";
import {
  PuertoRicoVariantConfig,
  VariantConfig,
} from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { PuertoRicoRules } from "./rules";
import { PuertoRicoMapSettings } from "./settings";
import { PuertoRicoVariantEditor } from "./variant_editor";

export class PuertoRicoViewSettings
  extends PuertoRicoMapSettings
  implements MapViewSettings
{
  getMapRules = PuertoRicoRules;

  getInitialVariantConfig(): VariantConfig {
    return { gameKey: GameKey.PUERTO_RICO, difficulty: "versado" };
  }

  getVariantConfigEditor = PuertoRicoVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const difficulty = (variant as PuertoRicoVariantConfig).difficulty;
    return [difficulty.charAt(0).toUpperCase() + difficulty.slice(1)];
  }
}
