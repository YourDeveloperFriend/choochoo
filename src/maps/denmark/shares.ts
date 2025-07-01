import { ShareHelper } from "../../engine/shares/share_helper";
import {
  TakeSharesAction,
  TakeSharesData,
} from "../../engine/shares/take_shares";

export class DenmarkShareHelper extends ShareHelper {
  getMaxShares(): number {
    // There is no limit to how many shares a player can take
    return Infinity;
  }
}

export class DenmarkTakeSharesAction extends TakeSharesAction {
  process(data: TakeSharesData): boolean {
    const numShares = data.numShares;
    if (numShares === 0) {
      this.log.currentPlayer("does not take out any shares");
    } else {
      this.log.currentPlayer(
        `takes out ${numShares} shares, receiving $${6 * numShares} and going back ${numShares} on income`,
      );
    }

    this.playerHelper.updateCurrentPlayer((player) => {
      player.income -= numShares;
      player.money += 6 * numShares;
    });

    return true;
  }
}
