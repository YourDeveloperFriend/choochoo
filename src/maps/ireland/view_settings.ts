import { GameKey } from "../../api/game_key";
import { IrelandVariantConfig, VariantConfig } from "../../api/variant_config";
import { useGame } from "../../client/services/game";
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

  getVariantString(variant: VariantConfig): string[] | undefined {
    if ((variant as IrelandVariantConfig).locoVariant) {
      return ["Loco"];
    }
  }

  getActionDescription(action: Action): string | undefined {
    const game = useGame();
    if (action === Action.LOCOMOTIVE) {
      if (IrelandVariantConfig.parse(game.variant).locoVariant) {
        return "Temporarily increase your locomotive by one for the round. Does not increase your expenses.";
      } else {
        return "Allows you to loco twice in one round.";
      }
    }
    return undefined;
  }
}
