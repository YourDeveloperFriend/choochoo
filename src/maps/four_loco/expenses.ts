import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { MoneyManager } from "../../engine/game/money_manager";
import { PlayerHelper } from "../../engine/game/player";
import { injectPlayersByTurnOrder } from "../../engine/game/state";
import { ExpensesPhase } from "../../engine/income_and_expenses/expenses";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

const FORCED_SHARE_COST = 3;

/**
 * In 4 Loco, engine level does NOT count toward expenses.
 * Players only pay for their shares (not locomotive level).
 */
export class FourLocoProfitHelper extends ProfitHelper {
  getExpenses(player: PlayerData): number {
    return player.shares;
  }
}

/**
 * In 4 Loco, when a player cannot afford expenses they are forced to issue
 * shares at $3 each (instead of losing income).  Normal share-phase shares
 * still cost $5 — this override only applies at the expense step.
 */
export class FourLocoExpensesPhase extends ExpensesPhase {
  private readonly flProfitHelper = inject(ProfitHelper);
  private readonly flLog = inject(Log);
  private readonly flMoneyManager = inject(MoneyManager);
  private readonly flPlayerHelper = inject(PlayerHelper);
  private readonly flPlayers = injectPlayersByTurnOrder();

  onStart(): void {
    for (const player of this.flPlayers()) {
      const expenses = this.flProfitHelper.getExpenses(player);

      if (player.money < expenses) {
        const deficit = expenses - player.money;
        const sharesNeeded = Math.ceil(deficit / FORCED_SHARE_COST);

        this.flPlayerHelper.update(player.color, (p) => {
          p.shares += sharesNeeded;
          p.money += FORCED_SHARE_COST * sharesNeeded;
        });

        this.flLog.player(
          player,
          `cannot afford expenses and is forced to issue ${sharesNeeded} share${sharesNeeded === 1 ? "" : "s"} at $${FORCED_SHARE_COST} each`,
        );
      }

      const result = this.flMoneyManager.addMoney(player.color, -expenses, true);

      if (result.lostIncome === 0) {
        const profit = this.flProfitHelper.getProfit(player);
        if (profit > 0) {
          this.flLog.player(player, `earns $${profit}`);
        } else {
          this.flLog.player(player, `pays $${-profit} for expenses`);
        }
      } else {
        this.flLog.player(
          player,
          `cannot afford expenses and loses ${result.lostIncome} income`,
        );
        if (result.outOfGame) {
          this.flLog.player(player, `drops out of the game`);
        }
      }
    }
  }
}
