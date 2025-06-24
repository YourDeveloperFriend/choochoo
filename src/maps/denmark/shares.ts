import { ShareHelper } from "../../engine/shares/share_helper";
import {TakeSharesAction, TakeSharesData} from "../../engine/shares/take_shares";

export class DenmarkShareHelper extends ShareHelper {
  getMaxShares(): number {
    // This lets players take shares until they hit -15 income. Technically shares should be unlimited. In practice this is Good Enough.
    return this.currentPlayer().income + 15;
  }
}

export class DenmarkTakeSharesAction extends TakeSharesAction {
  process(data: TakeSharesData): boolean {
    const numShares = data.numShares;
    if (this.helper.getSharesTheyCanTake() === 0) {
      this.log.currentPlayer(`cannot take out anymore shares`);
    } else if (numShares === 0) {
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
