import { RoundEngine } from "../../engine/game/round";

export class DoubleBaseUsaRoundEngine extends RoundEngine {
  maxRounds(): number {
    if (this.playerCount() <= 5) {
      return 8;
    }
    return 7;
  }
}
