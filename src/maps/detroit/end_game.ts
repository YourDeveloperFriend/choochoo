import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { MapKey } from "../../engine/framework/key";
import { MoneyManager } from "../../engine/game/money_manager";
import { PlayerHelper, Score } from "../../engine/game/player";
import { ROUND, RoundEngine } from "../../engine/game/round";
import { PlayerColorZod, PlayerData } from "../../engine/state/player";

export const OUT_OF_GAME_ROUND = new MapKey('outOfGameRound', PlayerColorZod.parse, z.number().parse);

export class DetroitPlayerHelper extends PlayerHelper {
  private readonly rounds = injectState(OUT_OF_GAME_ROUND);
  private readonly currentRound = injectState(ROUND);

  getScore(player: PlayerData): Score {
    return this.rounds().get(player.color) ?? this.currentRound();
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