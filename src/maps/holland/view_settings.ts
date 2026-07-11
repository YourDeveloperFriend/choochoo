import { VariantConfig } from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { HollandRules } from "./rules";
import { HollandMapSettings } from "./settings";
import { HollandVariantConfig } from "./variant_config";
import { HollandVariantEditor } from "./variant_editor";
import * as styles from "./holland.module.css";
import { POLDER_STYLE } from "./grid";

export class HollandViewSettings
  extends HollandMapSettings
  implements MapViewSettings
{
  getMapRules = HollandRules;

  getLandStyles = () => ({
    [POLDER_STYLE]: styles.polder,
  });

  getInitialVariantConfig(): VariantConfig {
    return { windmillVariant: false };
  }

  getVariantConfigEditor = HollandVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const config = variant as HollandVariantConfig;
    return config.windmillVariant ? ["2015 Windmill Variant"] : undefined;
  }
}
