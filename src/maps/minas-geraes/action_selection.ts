import { SelectAction, SelectData } from "../../engine/select_action/select";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ActionMoney } from "./starter";
import { assert } from "../../utils/validate";
import { PlayerHelper } from "../../engine/game/player";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { MiningToMoneyAction } from "./mining";
import { ActionProcessor } from "../../engine/game/action";
import { Action } from "../../engine/state/action";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Key } from "../../engine/framework/key";
import z from "zod";
import { Log } from "../../engine/game/log";

export class MinasGeraesSelectActionPhase extends SelectActionPhase {
  private readonly actionMoney = injectState(ActionMoney);
  private readonly goldsmithVariant = injectState(GoldsmithVariant);

  configureActions() {
    super.configureActions();
    this.installAction(MiningToMoneyAction);
    this.installAction(MinasGeraesPickGoldsmithVariantAction);
  }

  onStart() {
    super.onStart();
    this.goldsmithVariant.set(-1);
  }

  onEnd() {
    super.onEnd();
    const unselectedActions = this.allowedActions.getAvailableActions();
    this.actionMoney.update((actionMoney) => {
      for (const action of unselectedActions) {
        actionMoney.set(action, 0);
      }
    });
  }
}

export class MinasGeraesSelectAction extends SelectAction {
  private readonly actionMoney = injectState(ActionMoney);
  private readonly playerHelper = inject(PlayerHelper);

  validate({ action }: SelectData) {
    super.validate({ action });

    const cost = this.actionMoney().get(action);
    if (cost !== undefined && cost > 0) {
      assert(this.currentPlayer().money >= cost, {
        invalidInput:
          "Not enough money to pay the cost for the selected action.",
      });
    }
  }

  process({ action, forced }: SelectData): boolean {
    const result = super.process({ action, forced });

    const cost = this.actionMoney().get(action) || 0;
    if (cost > 0) {
      this.playerHelper.updateCurrentPlayer((player) => (player.money -= cost));
    }
    this.actionMoney.update((actionMoney) => actionMoney.set(action, cost + 1));

    if (action === Action.GOLDSMITH) {
      return false;
    }

    return result;
  }
}

export const GoldsmithVariant = new Key("GoldsmithVariant", z.number());
export const GOLDSMITH_VARIANT_NO_MINING_EXPERTISE = 1;
export const GOLDSMITH_VARIANT_BONUS_INCOME = 2;
export const PickGoldsmithVariantData = z.object({
  goldsmithVariant: z.number(),
});
export type PickGoldsmithVariantData = z.infer<typeof PickGoldsmithVariantData>;

export class MinasGeraesPickGoldsmithVariantAction
  implements ActionProcessor<PickGoldsmithVariantData>
{
  static readonly action = "pick-goldsmith-variant";

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly goldsmithVariant = injectState(GoldsmithVariant);
  private readonly log = inject(Log);

  readonly assertInput = PickGoldsmithVariantData.parse;

  canEmit(): boolean {
    return (
      this.currentPlayer().selectedAction === Action.GOLDSMITH &&
      this.goldsmithVariant() === -1
    );
  }

  validate(data: PickGoldsmithVariantData) {
    assert(this.currentPlayer().selectedAction === Action.GOLDSMITH);
    assert(this.goldsmithVariant() === -1);
    assert(
      data.goldsmithVariant === GOLDSMITH_VARIANT_NO_MINING_EXPERTISE ||
        data.goldsmithVariant == GOLDSMITH_VARIANT_BONUS_INCOME,
    );
  }

  process(data: PickGoldsmithVariantData): boolean {
    this.goldsmithVariant.set(data.goldsmithVariant);
    if (data.goldsmithVariant === GOLDSMITH_VARIANT_NO_MINING_EXPERTISE) {
      this.log.currentPlayer(
        "chooses to use the Goldsmith action to not spend mining expertise when delivering gold.",
      );
    } else if (data.goldsmithVariant === GOLDSMITH_VARIANT_BONUS_INCOME) {
      this.log.currentPlayer(
        "chooses to use the Goldsmith action to receive an additional income when delivering gold this round.",
      );
    }
    return true;
  }
}
