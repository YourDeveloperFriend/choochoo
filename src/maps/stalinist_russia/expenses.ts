import { ProfitHelper } from "../../engine/income_and_expenses/helper";
import { PlayerData } from "../../engine/state/player";

export class StalinistRussiaProfitHelper extends ProfitHelper {
  getExpenses(player: PlayerData): number {
    // The locomotive track does not contribute to expenses; only shares do.
    return player.shares;
  }
}
