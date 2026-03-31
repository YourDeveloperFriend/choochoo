import { inject } from "../framework/execution_context";
import { Log } from "../game/log";
import { MoneyManager } from "../game/money_manager";
import { PhaseModule } from "../game/phase_module";
import { injectPlayersByTurnOrder } from "../game/state";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { ProfitHelper } from "./helper";

export class ExpensesPhase extends PhaseModule {
  static readonly phase = Phase.EXPENSES;

  private readonly profitHelper = inject(ProfitHelper);
  private readonly log = inject(Log);
  private readonly moneyManager = inject(MoneyManager);
  private readonly players = injectPlayersByTurnOrder();

  onStart(): void {
    for (const player of this.players()) {
      const expenses = this.profitHelper.getExpenses(player);
      const result = this.moneyManager.addMoney(player.color, -expenses, true);

      if (result.lostIncome === 0) {
        const profit = this.profitHelper.getProfit(player);
        if (profit > 0) {
          this.log.player(player, `earns $${profit}`);
        } else {
          this.log.player(player, `pays $${-profit} for expenses`);
        }
      } else {
        this.log.player(
          player,
          `cannot afford expenses and loses ${result.lostIncome} income`,
        );
        if (result.outOfGame) {
          this.log.player(player, `drops out of the game`);
        }
      }
    }
    super.onStart();
  }

  getPlayerOrder(): PlayerColor[] {
    return [];
  }
}
