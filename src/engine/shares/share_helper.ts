import { injectCurrentPlayer } from "../game/state";

export class ShareHelper {
  protected readonly currentPlayer = injectCurrentPlayer();

  getMaxShares(): number {
    return Infinity;
  }

  getSharesTheyCanTake(): number {
    return this.getMaxShares() - this.currentPlayer().shares;
  }
}
