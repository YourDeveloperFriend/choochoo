import { PlayerData } from "../state/player";

export class ProfitHelper {
  getProfit(player: PlayerData): number {
    return this.getIncome(player) - this.getExpenses(player);
  }

  getIncome(player: PlayerData): number {
    return player.income;
  }

  /**
   * Not meant to be overridden. Sums `getExpenseBreakdown()` into the total expenses;
   * override that instead to change what a map charges.
   */
  getExpenses(player: PlayerData): number {
    let total = 0;
    for (const value of this.getExpenseBreakdown(player).values()) {
      total += value;
    }
    return total;
  }

  /**
   * Returns every named contribution to this player's expenses, keyed by a
   * human-readable label. `getExpenses()` sums these values to compute the total, so
   * override this method (not `getExpenses()`) to change what a map charges.
   */
  getExpenseBreakdown(player: PlayerData): Map<ExpenseBreakdownKey, number> {
    return new Map([
      ["Share interest", player.shares],
      ["Locomotive maintenance", player.locomotive],
    ]);
  }
}

export type ExpenseBreakdownKey = string;
