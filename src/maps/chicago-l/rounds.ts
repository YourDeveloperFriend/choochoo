import { RoundEngine } from "../../engine/game/round";

export class ChicagoLRoundEngine extends RoundEngine {
  maxRounds(): number {
    return 9;
  }
}
