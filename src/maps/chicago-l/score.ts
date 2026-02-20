import { PlayerHelper } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";

export class ChicagoLPlayerHelper extends PlayerHelper {
  getScoreFromIncome(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return 2 * player.income;
  }

  getScoreFromShares(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return -2 * player.shares;
  }
}
