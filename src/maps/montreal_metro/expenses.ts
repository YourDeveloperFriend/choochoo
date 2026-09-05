import { injectState } from "../../engine/framework/execution_context";
import {
  ExpenseBreakdownKey,
  ProfitHelper,
} from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";
import { GOVERNMENT_ENGINE_LEVEL } from "./government_engine_level";

export class MontrealMetroProfitHelper extends ProfitHelper {
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);

  getExpenseBreakdown(player: PlayerData): Map<ExpenseBreakdownKey, number> {
    const breakdown = super.getExpenseBreakdown(player);
    breakdown.set(
      "Government engine surcharge",
      this.govtEngineLevel().get(player.color)!,
    );
    return breakdown;
  }
}
