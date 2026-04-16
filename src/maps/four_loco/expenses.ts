import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { PlayerHelper } from "../../engine/game/player";
import { injectPlayersByTurnOrder } from "../../engine/game/state";
import { ExpensesPhase } from "../../engine/income_and_expenses/expenses";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { TakeSharesAction, TakeSharesData } from "../../engine/shares/take_shares";
import { ShareHelper } from "../../engine/shares/share_helper";
import { PlayerData } from "../../engine/state/player";

const SHARE_COST = 3;

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
 * In 4 Loco, all shares (both voluntary and emergency) cost $3 instead of $5.
 */
export class FourLocoTakeSharesAction extends TakeSharesAction {
  process({ numShares }: TakeSharesData): boolean {
    if (this.helper.getSharesTheyCanTake() === 0) {
      this.log.currentPlayer(`cannot take out anymore shares`);
    } else if (numShares === 0) {
      this.log.currentPlayer("does not take out any shares");
    } else {
      this.log.currentPlayer(
        `takes out ${numShares} shares and receives $${SHARE_COST * numShares}`,
      );
    }

    this.playerHelper.updateCurrentPlayer((player) => {
      player.shares += numShares;
      player.money += SHARE_COST * numShares;
    });

    return true;
  }
}

/**
 * In 4 Loco, when a player cannot afford expenses they are forced to issue
 * emergency shares at $3 each (instead of losing income).
 * After issuing the minimum required shares, the normal expense deduction runs.
 */
export class FourLocoExpensesPhase extends ExpensesPhase {
  private readonly profitHelper = inject(ProfitHelper);
  private readonly log = inject(Log);
  private readonly playerHelper = inject(PlayerHelper);
  private readonly shareHelper = inject(ShareHelper);
  private readonly players = injectPlayersByTurnOrder();

  onStart(): void {
    for (const player of this.players()) {
      const expenses = this.profitHelper.getExpenses(player);

      if (player.money < expenses) {
        const deficit = expenses - player.money;
        const sharesNeeded = Math.min(
          Math.ceil(deficit / SHARE_COST),
          this.shareHelper.getMaxShares() - player.shares,
        );

        if (sharesNeeded > 0) {
          this.playerHelper.update(player.color, (p) => {
            p.shares += sharesNeeded;
            p.money += SHARE_COST * sharesNeeded;
          });

          this.log.player(
            player,
            `cannot afford expenses and is forced to issue ${sharesNeeded} share${sharesNeeded === 1 ? "" : "s"} at $${SHARE_COST} each`,
          );
        }
      }
    }

    super.onStart();
  }
}
