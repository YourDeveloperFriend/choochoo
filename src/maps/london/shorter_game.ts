import { RoundEngine } from "../../engine/game/round";
import { assert } from "../../utils/validate";

export class LondonRoundEngine extends RoundEngine {
  maxRounds(): number {
    const numPlayers = this.playerCount();

    switch (numPlayers) {
      case 3:
        return 9;
      case 4:
        return 7;
      case 5:
        return 6;
      case 6:
        return 5;
      default:
        assert(false, "unknown number of rounds for player count");
    }
  }
}
