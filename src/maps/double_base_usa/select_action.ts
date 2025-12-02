import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action } from "../../engine/state/action";
import { inject, injectState } from "../../engine/framework/execution_context";
import { DoubleBaseUsaPlayerData } from "./starter";
import { PlayerColor } from "../../engine/state/player";
import { assert, assertNever } from "../../utils/validate";
import { BAG } from "../../engine/game/state";
import { Random } from "../../engine/game/random";
import { PRODUCTION_STATE } from "./production";
import { Good } from "../../engine/state/good";

export class DoubleBaseUsaSelectAction extends SelectAction {
  private readonly playerData = injectState(DoubleBaseUsaPlayerData);
  private readonly productionState = injectState(PRODUCTION_STATE);
  private readonly bag = injectState(BAG);
  private readonly random = inject(Random);

  protected applyLocomotive(): void {}

  validate(data: SelectData): void {
    super.validate(data);
    assert(this.productionState().goods.length === 0, {
      invalidInput:
        "cannot select an action while production goods need to be placed",
    });
  }

  process(data: SelectData): boolean {
    const result = super.process(data);

    if (
      data.action === Action.LOCOMOTIVE ||
      data.action === Action.DOUBLE_BASE_LOCOMOTIVE
    ) {
      let count: number;
      switch (data.action) {
        case Action.LOCOMOTIVE:
          count = 2;
          break;
        case Action.DOUBLE_BASE_LOCOMOTIVE:
          count = 1;
          break;
        default:
          assertNever(data.action);
      }
      this.increaseLocoDiscs(this.currentPlayer().color, count);
      this.log.currentPlayer("receives " + count + " bonus loco discs.");
    }

    if (data.action === Action.PRODUCTION) {
      let pull: Good[] = [];
      this.bag.update((bag) => {
        pull = this.random.draw(2, bag, false);
      });
      if (pull.length > 0) {
        this.productionState.set({
          goods: pull,
        });
        return false;
      }
    }

    return result;
  }

  private increaseLocoDiscs(player: PlayerColor, count: number): void {
    this.playerData.update((oldData) => {
      oldData.get(player)!.locoDiscs += count;
    });
  }
}
