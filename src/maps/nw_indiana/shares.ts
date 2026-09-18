import { TakeSharesAction } from "../../engine/shares/take_shares";
import { PlayerData } from "../../engine/state/player";

export class NwIndianaTakeSharesAction extends TakeSharesAction {
  calculateMoneyForAdditionalShares(
    player: PlayerData,
    numShares: number,
  ): number {
    let money = 0;
    for (
      let share = player.shares + 1;
      share <= player.shares + numShares;
      share++
    ) {
      if (share <= 5) {
        money += 5;
      } else if (share <= 10) {
        money += 6;
      } else {
        money += 7;
      }
    }
    return money;
  }
}
