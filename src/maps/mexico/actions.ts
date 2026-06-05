import { Action, ActionNamingProvider } from "../../engine/state/action";
import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { MexicoVariantConfig } from "./variant_config";

export class MexicoActionNamingProvider extends ActionNamingProvider {
  private readonly gameMemory = inject(GameMemory);

  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      const isRedBlackProduction = !!this.gameMemory.getVariant(
        MexicoVariantConfig.parse,
      ).redBlackProduction;
      if (isRedBlackProduction) {
        return "Optionally, take a red and black cube from the bag and place them both on one city.";
      } else {
        return "Optionally, draw two goods from the bag and place on of them on a city.";
      }
    }
    return super.getActionDescription(action);
  }
}
