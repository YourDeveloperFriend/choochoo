import { PlayerHelper } from "../../engine/game/player";
import { ShareHelper } from "../../engine/shares/share_helper";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { PlayerData } from "../../engine/state/player";

/** 18 shares, each worth $8. */
export class MauiShareHelper extends ShareHelper {
  getMaxShares(): number {
    return 18;
  }
}

export class MauiTakeSharesAction extends TakeSharesAction {
  calculateMoneyForAdditionalShares(_: PlayerData, numShares: number): number {
    return 8 * numShares;
  }
}

/** Income is worth +2VP and shares -2VP (instead of 3). */
export class MauiPlayerHelper extends PlayerHelper {
  getScoreFromIncome(player: PlayerData): number {
    if (player.outOfGame) {
      return 0;
    }
    return 2 * player.income;
  }

  getScoreFromShares(player: PlayerData): number {
    if (player.outOfGame) {
      return 0;
    }
    return -2 * player.shares;
  }
}
