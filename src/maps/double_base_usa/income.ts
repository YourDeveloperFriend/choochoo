import { IncomeReductionPhase } from "../../engine/income_and_expenses/reduction";

export class DoubleBaseUsaIncomeReductionPhase extends IncomeReductionPhase {
  protected calculateIncomeReduction(income: number): number {
    return Math.ceil((income - 10) / 10) * 2;
  }
}
