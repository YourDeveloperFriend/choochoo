import { PlayerHelper, Score } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";
import { Good } from "../../engine/state/good";

export class PuertoRicoPlayerHelper extends PlayerHelper {
  protected soloGoalScore(): Score {
    return [0];
  }

  calculateScore(player: PlayerData): number {
    const grid = this.grid();
    let blackCubes = 0;

    for (const space of grid.values()) {
      if (space && Array.isArray(space.data.goods)) {
        blackCubes += space.data.goods.filter(
          (good) => good === Good.BLACK,
        ).length;
      }
    }

    return super.calculateScore(player) - 10 * blackCubes;
  }

  getPlayersOrderedByScore(): PlayerData[][] {
    if (this.players().length === 1) {
      const [player] = this.players();
      this.getScore(player); 
      return [[player]]; 
    }
    return super.getPlayersOrderedByScore();
  }
}
