import { PlayerHelper, ScoreBreakdownKey } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";

export class NewEnglandPlayerHelper extends PlayerHelper {
  getScoreBreakdown(player: PlayerData): Map<ScoreBreakdownKey, number> {
    const breakdown = super.getScoreBreakdown(player);
    if (!player.outOfGame) {
      breakdown.set("Money bonus", Math.floor(player.money / 20));
    }
    return breakdown;
  }
}
