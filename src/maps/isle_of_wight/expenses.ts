import {
  ExpenseBreakdownKey,
  ProfitHelper,
} from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

export class IsleOfWightProfitHelper extends ProfitHelper {
  getExpenseBreakdown(player: PlayerData): Map<ExpenseBreakdownKey, number> {
    return new Map([["Share interest", player.shares]]);
  }
}
