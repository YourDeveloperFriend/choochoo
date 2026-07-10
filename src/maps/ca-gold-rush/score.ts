import { injectState } from "../../engine/framework/execution_context";
import { PlayerHelper, ScoreBreakdownKey } from "../../engine/game/player";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";
import { MapKey } from "../../engine/framework/key";
import z from "zod";

export const OwnedGold = new MapKey(
  "OwnedGold",
  PlayerColorZod.parse,
  z.number().parse,
);

export class CaliforniaGoldRushPlayerHelper extends PlayerHelper {
  private readonly ownedGold = injectState(OwnedGold);

  getScoreBreakdown(playerData: PlayerData): Map<ScoreBreakdownKey, number> {
    const breakdown = super.getScoreBreakdown(playerData);
    breakdown.set("Gold", this.getScoreFromGold(playerData));
    return breakdown;
  }

  getScoreFromGold(playerData: PlayerData): number {
    return 15 * this.ownedGold().get(playerData.color)!;
  }
}
