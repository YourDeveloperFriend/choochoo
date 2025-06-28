import { injectCurrentPlayer } from "../game/state";

export class ShareHelper {
  protected readonly currentPlayer = injectCurrentPlayer();

  getMaxShares(): number {
    return 15;
  }

  getSharesTheyCanTake(): number {
    return this.getMaxShares() - this.currentPlayer().shares;
  }
}
