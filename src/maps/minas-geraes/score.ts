import { PlayerHelper } from "../../engine/game/player";
import { PlayerData } from "../../engine/state/player";
import { injectState } from "../../engine/framework/execution_context";
import { MiningExpertise } from "./mining";

export class MinasGeraesPlayerHelper extends PlayerHelper {
  private readonly miningExpertise = injectState(MiningExpertise);

  /** Returns the players ordered by their score. Tied players end up in the same placement in the array. */
  getPlayersOrderedByScore(): PlayerData[][] {
    const superPlayerPlacement = super.getPlayersOrderedByScore();
    const miningExpertise = this.miningExpertise();

    // Go through the super placement array, applying tie breaker based on mining expertise
    const playerPlacement: PlayerData[][] = [];
    for (const tiedPlayers of superPlayerPlacement) {
      if (tiedPlayers.length <= 1) {
        playerPlacement.push(tiedPlayers);
        continue;
      }
      const sorted = [...tiedPlayers].sort(
        (a, b) =>
          (miningExpertise.get(b.color) ?? 0) -
          (miningExpertise.get(a.color) ?? 0),
      );
      let current: PlayerData[] = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prevExpertise = miningExpertise.get(sorted[i - 1].color) ?? 0;
        const curExpertise = miningExpertise.get(sorted[i].color) ?? 0;
        if (prevExpertise !== curExpertise) {
          playerPlacement.push(current);
          current = [];
        }
        current.push(sorted[i]);
      }
      playerPlacement.push(current);
    }

    return playerPlacement;
  }
}
