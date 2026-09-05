import {
  ExpenseBreakdownKey,
  ProfitHelper,
} from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

export class StalinistRussiaProfitHelper extends ProfitHelper {
  getExpenseBreakdown(player: PlayerData): Map<ExpenseBreakdownKey, number> {
    // The locomotive track does not contribute to expenses; only shares do.
    return new Map([["Share interest", player.shares]]);
  }
}
