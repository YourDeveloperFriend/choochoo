import { GameKey } from "../../api/game_key";
import { CyprusVariantConfig, VariantConfig } from "../../api/variant_config";
import { MapViewSettings } from "../view_settings";
import { CyprusRules } from "./rules";
import { CyprusMapSettings } from "./settings";
import { CyprusVariantEditor } from "./variant_editor";

export class CyprusViewSettings
  extends CyprusMapSettings
  implements MapViewSettings
{
  getMapRules = CyprusRules;

  getInitialVariantConfig(): VariantConfig {
    return { gameKey: GameKey.CYPRUS, version: 2020 };
  }

  getVariantConfigEditor = CyprusVariantEditor;

  getVariantString(variant: VariantConfig): string[] | undefined {
    const version = (variant as CyprusVariantConfig).version;
    return [`${version} rules`];
  }
}
