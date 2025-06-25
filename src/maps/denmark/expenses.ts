import { IncomeReductionPhase } from "../../engine/income_and_expenses/reduction";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

export class DenmarkIncomeReduction extends IncomeReductionPhase {
  protected calculateIncomeReduction(income: number): number {
    if (income <= 0) return 0;
    if (income <= 5) return 2;
    if (income <= 10) return 4;
    if (income <= 15) return 6;
    if (income <= 20) return 8;
    return 10;
  }
}

export class DenmarkProfitHelper extends ProfitHelper {
  getExpenses(_: PlayerData): number {
    return 0;
  }
}
