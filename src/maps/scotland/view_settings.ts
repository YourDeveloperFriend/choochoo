import { VariantConfig } from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { ScotlandRules } from "./rules";
import { ScotlandRivers } from "./rivers";
import { ScotlandMapSettings } from "./settings";
import { ScotlandVariantConfig } from "./variant_config";
import { ScotlandVariantEditor } from "./variant_editor";

export class ScotlandViewSettings
  extends ScotlandMapSettings
  implements MapViewSettings
{
  getMapRules = ScotlandRules;
  getTexturesLayer = ScotlandRivers;

  getInitialVariantConfig(): VariantConfig {
    return {
      smallerBag: false,
    };
  }

  getVariantConfigEditor = ScotlandVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const config = variant as ScotlandVariantConfig;
    const tags: string[] = [];
    if (config.smallerBag) {
      tags.push("Smaller Bag");
    }
    return tags.length > 0 ? tags : undefined;
  }
}
