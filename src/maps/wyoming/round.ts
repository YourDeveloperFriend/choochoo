import { assert } from "../../utils/validate";
import { RoundEngine } from "../../engine/game/round";

export class WyomingRoundEngine extends RoundEngine {
  maxRounds(): number {
    const numPlayers = this.playerCount();

    switch (numPlayers) {
      case 2:
        return 8;
      case 3:
        return 6;
      default:
        assert(false, "unknown number of rounds for player count");
    }
  }
}
