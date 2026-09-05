import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import {
  ExpenseBreakdownKey,
  ProfitHelper,
} from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

export class NwIndianaProfitHelper extends ProfitHelper {
  private readonly round = injectState(ROUND);

  getExpenseBreakdown(player: PlayerData): Map<ExpenseBreakdownKey, number> {
    const isWinter = this.round() % 2 === 0;
    const locomotiveExpense = isWinter
      ? player.locomotive * 2
      : player.locomotive;
    return new Map([
      ["Share interest", player.shares],
      ["Locomotive maintenance", locomotiveExpense],
    ]);
  }
}
