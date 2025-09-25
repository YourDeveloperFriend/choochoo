import { injectState } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
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

  calculateScore(playerData: PlayerData): number {
    return super.calculateScore(playerData) + this.getScoreFromGold(playerData);
  }

  getScoreFromGold(playerData: PlayerData): number {
    return 15 * this.ownedGold().get(playerData.color)!;
  }
}
