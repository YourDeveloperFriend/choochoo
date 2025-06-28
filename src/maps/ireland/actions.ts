import { Action, ActionNamingProvider } from "../../engine/state/action";
import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { IrelandVariantConfig } from "../../api/variant_config";

export class IrelandActionNamingProvider extends ActionNamingProvider {
  private readonly gameMemory = inject(GameMemory);

  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      if (this.gameMemory.getVariant(IrelandVariantConfig.parse).locoVariant) {
        return "Temporarily increase your locomotive by one for the round. Does not increase your expenses.";
      } else {
        return "Allows you to loco twice in one round.";
      }
    }
    return super.getActionDescription(action);
  }
}
