import { ReversteamVariantConfig } from "./variant_config";
import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { Good } from "../../engine/state/good";

export class ReversteamMoveHelper extends MoveHelper {
  private readonly gameMemory = inject(GameMemory);

  canDeliverTo(city: City, good: Good): boolean {
    if (this.gameMemory.getVariant(ReversteamVariantConfig.parse).baseRules) {
      return super.canDeliverTo(city, good);
    }
    if (city.goodColors()[0] === Good.BLACK) return false;
    return !city.accepts(good);
  }
}
