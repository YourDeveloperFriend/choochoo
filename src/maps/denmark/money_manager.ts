import { MoneyManager } from "../../engine/game/money_manager";
import { PlayerData } from "../../engine/state/player";

export class DenmarkMoneyManager extends MoneyManager {
  protected isBankrupt(player: PlayerData, forced: boolean): boolean {
    if (forced) {
      // Bankruptcy only applies during expenses phase
      return player.income <= -10;
    }
    return false;
  }
}
