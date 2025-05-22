import { PlayerHelper, Score } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";

export class NewEnglandPlayerHelper extends PlayerHelper {
  getScore(player: PlayerData): Score {
    const score = super.getScore(player);
    if (!Array.isArray(score)) {
      return score;
    }
    score[0] += Math.floor(player.money / 20);
    return score;
  }
}
