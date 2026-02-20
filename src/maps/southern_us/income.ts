import { IncomeReductionPhase } from "../../engine/income_and_expenses/reduction";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";

export class SouthernUSIncomeReductionPhase extends IncomeReductionPhase {
  private readonly round = injectState(ROUND);

  protected calculateIncomeReduction(income: number): number {
    return this.round() === 4
      ? super.calculateIncomeReduction(income) * 2
      : super.calculateIncomeReduction(income);
  }
}
