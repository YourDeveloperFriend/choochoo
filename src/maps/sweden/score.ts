import { inject } from "../../engine/framework/execution_context";
import { PlayerHelper, ScoreBreakdownKey } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";
import { Incinerator } from "./incinerator";

export class SwedenPlayerHelper extends PlayerHelper {
  private readonly incinerator = inject(Incinerator);

  getScoreBreakdown(playerData: PlayerData): Map<ScoreBreakdownKey, number> {
    const breakdown = super.getScoreBreakdown(playerData);
    breakdown.set("Garbage bonus", this.getScoreFromGarbage(playerData));
    return breakdown;
  }

  getScoreFromGarbage(playerData: PlayerData): number {
    return 2 * this.incinerator.getGarbageCountForUser(playerData.color);
  }
}
