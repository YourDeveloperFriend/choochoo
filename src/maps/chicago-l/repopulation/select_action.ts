import {
  inject,
  injectState,
} from "../../../engine/framework/execution_context";
import { Random } from "../../../engine/game/random";
import { BAG } from "../../../engine/game/state";
import { SelectAction, SelectData } from "../../../engine/select_action/select";
import { Action } from "../../../engine/state/action";
import { Good, goodToString } from "../../../engine/state/good";
import { assert } from "../../../utils/validate";
import { REPOPULATION } from "./state";
import { GOVERNMENT_ENGINE_LEVEL } from "../starter";

export class ChicagoLSelectAction extends SelectAction {
  private readonly random = inject(Random);
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);
  private readonly bag = injectState(BAG);
  private readonly repopulation = injectState(REPOPULATION);

  canEmit(): boolean {
    return !this.repopulation.isInitialized();
  }

  protected applyLocomotive(): void {
    const currentPlayer = this.currentPlayer();
    const currentGvtLoco = this.govtEngineLevel().get(currentPlayer.color)!;
    if (currentGvtLoco >= this.getMaxGvtLoco()) return;

    this.govtEngineLevel.update((engineLevel) => {
      engineLevel.set(currentPlayer.color, currentGvtLoco + 1);
    });
    // Moving from 3 to 4 also increases the loco value from 6 to 7
    if (currentGvtLoco === 3) {
      assert(currentPlayer.locomotive === 6);
      this.helper.updateCurrentPlayer((player) => {
        player.locomotive = 7;
      });
    }
  }

  private getMaxGvtLoco(): number {
    const currentLoco = this.currentPlayer().locomotive;
    switch (currentLoco) {
      case 1:
      case 2:
        return 1;
      case 3:
        return 2;
      case 4:
      case 5:
        return 3;
      case 6:
      case 7:
        return 4;
      default:
        throw new Error(`Invalid locomotive value: ${currentLoco}`);
    }
  }

  process(data: SelectData): boolean {
    const result = super.process(data);
    if (data.action === Action.REPOPULATION) {
      let pull: Good[];
      this.bag.update((bag) => {
        pull = this.random.draw(3, bag, false);
      });
      assert(pull! != null);
      if (pull.length === 0) {
        this.log.log(`Bag empty, skipping repopulation`);
        return true;
      }
      this.log.currentPlayer(
        `drew ${pull.map(goodToString).join(" ")} for repopulation`,
      );
      this.repopulation.initState(pull);
      return false;
    }
    return result;
  }
}
