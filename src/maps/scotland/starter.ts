import { inject } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { GameStarter } from "../../engine/game/starter";
import { Good } from "../../engine/state/good";
import { ScotlandVariantConfig } from "./variant_config";

const CUBES_REMOVED_PER_COLOR = 6;

export class ScotlandStarter extends GameStarter {
  private readonly gameMemory = inject(GameMemory);

  protected startingBag(): Good[] {
    const bag = super.startingBag();
    const { smallerBag } = this.gameMemory.getVariant(
      ScotlandVariantConfig.parse,
    );
    if (!smallerBag) {
      return bag;
    }
    for (const good of [
      Good.RED,
      Good.PURPLE,
      Good.YELLOW,
      Good.BLUE,
      Good.BLACK,
    ]) {
      let remaining = CUBES_REMOVED_PER_COLOR;
      for (let i = bag.length - 1; i >= 0 && remaining > 0; i--) {
        if (bag[i] === good) {
          bag.splice(i, 1);
          remaining--;
        }
      }
    }
    return bag;
  }
}
