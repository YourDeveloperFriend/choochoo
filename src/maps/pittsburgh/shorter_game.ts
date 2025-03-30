import { RoundEngine } from "../../engine/game/round";

export class PittsburghRoundEngine extends RoundEngine {
  maxRounds(): number {
    return 8;
  }
}
