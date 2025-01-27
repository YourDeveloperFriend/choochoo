import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { Action } from "../../engine/state/action";
import { MapViewSettings } from "../view_settings";
import { IrelandRivers } from "./rivers";
import { IrelandRules } from "./rules";
import { IrelandMapSettings } from "./settings";
import { IrelandVariantEditor } from "./variant_editor";

export class IrelandViewSettings
  extends IrelandMapSettings
  implements MapViewSettings
{
  getInitialVariantConfig(): VariantConfig {
    return { gameKey: GameKey.IRELAND, locoVariant: false };
  }
  getVariantConfigEditor = IrelandVariantEditor;

  getMapRules = IrelandRules;
  getTexturesLayer = IrelandRivers;

  getActionDescription(action: Action): string | undefined {
    if (action === Action.LOCOMOTIVE) {
      return "Temporarily increase your locomotive by one for the round. Does not increase your expenses.";
    }
    return undefined;
  }
}
