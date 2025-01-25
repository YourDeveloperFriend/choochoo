import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { IncomeReductionPhase } from "../../engine/income_and_expenses/reduction";
import { ShareHelper } from "../../engine/shares/share_helper";
import { PlayerData } from "../../engine/state/player";

export class DetroitProfitHelper extends ProfitHelper {
  protected readonly round = injectState(ROUND);
  getExpenses(player: PlayerData): number {
    return super.getExpenses(player) + this.round();
  }
}

export class DetroitShareHelper extends ShareHelper {
  getMaxShares(): number {
    return 25;
  }
}

export class DetroitIncomeReduction extends IncomeReductionPhase {
  private readonly playerCount = injectInitialPlayerCount();

  protected calculateIncomeReduction(income: number): number {
    if (income <= 5) return 0;
    if (this.playerCount() > 1 && income >= 51) return 10;
    return Math.floor((income - 1) / 5);
  }
}
