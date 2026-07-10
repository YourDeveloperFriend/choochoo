import { Ender } from "../../engine/game/ender";
import {
  PlayerHelper,
  Score,
  ScoreBreakdownKey,
} from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";

export class BarbadosGameEnd extends Ender {
  protected onEndGame(): void {
    const lostMoney = this.playerHelper.getSoloPlayer().shares * 5;
    this.log.player(
      this.playerHelper.getSoloPlayer(),
      `You pay $${lostMoney} for your shares.`,
    );
    this.playerHelper.update(
      this.playerHelper.getSoloPlayer().color,
      (playerData) => {
        playerData.money -= lostMoney;
        playerData.shares = 0;
        if (playerData.money < 0) {
          playerData.outOfGame = true;
        }
      },
    );
  }
}

export class BarbadosPlayerHelper extends PlayerHelper {
  protected isEliminatedForScoring(): boolean {
    return false;
  }

  protected getScoreTiebreakers(): number[] {
    return [];
  }

  getScoreBreakdown(player: PlayerData): Map<ScoreBreakdownKey, number> {
    return new Map([["Net worth", player.money - player.shares * 5]]);
  }

  protected soloGoalScore(): Score {
    return [0];
  }
}
