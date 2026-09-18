import { RoundEngine } from "../../engine/game/round";
import { assert } from "../../utils/validate";

export class IsleOfWightRoundEngine extends RoundEngine {
  maxRounds(): number {
    const playerCount = this.playerCount();
    assert(
      playerCount === 3 || playerCount === 4,
      "unknown number of rounds for player count",
    );
    return playerCount === 3 ? 9 : 8;
  }
}
