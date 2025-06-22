import {IncomeReductionPhase} from "../../engine/income_and_expenses/reduction";

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
