import { RoundEngine } from "../../engine/game/round";
import { assert } from "../../utils/validate";

export class CentralNewEnglandRoundEngine extends RoundEngine {
  maxRounds(): number {
    const numPlayers = this.playerCount();

    switch (numPlayers) {
      case 5:
        return 7;
      case 6:
        return 6;
      case 7:
        return 6;
      case 8:
        return 6;
      default:
        assert(false, "unknown number of rounds for player count");
    }
  }
}
