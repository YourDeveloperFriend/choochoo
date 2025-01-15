import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { MapKey } from "../../engine/framework/key";
import { MoneyManager } from "../../engine/game/money_manager";
import { PHASE } from "../../engine/game/phase";
import { PlayerHelper, Score } from "../../engine/game/player";
import { ROUND, RoundEngine } from "../../engine/game/round";
import { Phase } from "../../engine/state/phase";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";

export const OUT_OF_GAME_ROUND = new MapKey('outOfGameRound', PlayerColorZod.parse, z.number().parse);

export class DetroitPlayerHelper extends PlayerHelper {
  private readonly rounds = injectState(OUT_OF_GAME_ROUND);
  private readonly currentRound = injectState(ROUND);
  private readonly phase = injectState(PHASE);

  getScore(player: PlayerData): Score {
    if (this.phase() === Phase.END_GAME) {
      const bestScore = Math.max(...this.rounds().values());
      if (!this.rounds().has(player.color)) {
        // Surviving player must have played one more round than the last player to be eliminated.
        return [bestScore + 1, player.income];
      }
      return [this.rounds().get(player.color)!, 0];
    }
    return [this.rounds().get(player.color) ?? this.currentRound(), 0];
  }
}

export class DetroitMoneyManager extends MoneyManager {
  protected outOfGame(player: PlayerData): void {
    super.outOfGame(player);
  }
}

export class DetroitRoundEngine extends RoundEngine {
  maxRounds(): number {
    return Infinity;
  }
}