import { SelectAction, SelectData } from "../../engine/select_action/select";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { ActionZod } from "../../engine/state/action";
import { MapKey } from "../../engine/framework/key";
import z from "zod";

export const ActionMoney = new MapKey(
  "VermontActionMoney",
  ActionZod.parse,
  z.number().parse,
);

export class VermontSelectActionPhase extends SelectActionPhase {
  private readonly actionMoney = injectState(ActionMoney);

  onEnd() {
    super.onEnd();
    const numPlayers = this.players().length;
    const unselectedActions = this.allowedActions.getAvailableActions();
    this.actionMoney.update((actionMoney) => {
      for (const action of unselectedActions) {
        actionMoney.set(action, (actionMoney.get(action) || 0) + numPlayers);
      }
    });
  }
}

export class VermontSelectAction extends SelectAction {
  private readonly actionMoney = injectState(ActionMoney);
  private readonly playerHelper = inject(PlayerHelper);

  process({ action, forced }: SelectData): boolean {
    const result = super.process({ action, forced });

    const priorActionMoney = this.actionMoney().get(action) || 0;
    if (priorActionMoney > 0) {
      this.playerHelper.updateCurrentPlayer(
        (player) => (player.money += priorActionMoney),
      );
      this.actionMoney.update((actionMoney) => actionMoney.set(action, 0));
      this.log.currentPlayer(
        "gets $" + priorActionMoney + " for selecting the action.",
      );
    }

    return result;
  }
}
