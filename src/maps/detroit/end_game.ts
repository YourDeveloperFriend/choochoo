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
    return [this.getRoundsLasted(player), player.income];
  }

  protected getRoundsLasted(player: PlayerData): number {
    if (this.phase() === Phase.END_GAME) {
      // Surviving player must have played one more round than the last player to be eliminated.
      const bestScore = Math.max(...this.rounds().values()) + 1;
      return this.rounds().get(player.color) ?? bestScore;
    }
    return this.rounds().get(player.color) ?? this.currentRound();
  }
}

export class DetroitMoneyManager extends MoneyManager {
  private readonly rounds = injectState(OUT_OF_GAME_ROUND);
  private readonly round = injectState(ROUND);

  protected outOfGame(player: PlayerData): void {
    super.outOfGame(player);
    this.rounds.update((map) => map.set(player.color, this.round()));
  }
}

export class DetroitRoundEngine extends RoundEngine {
  maxRounds(): number {
    return Infinity;
  }
}