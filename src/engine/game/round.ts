import z from "zod";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { Key } from "../framework/key";
import { Log } from "./log";
import { injectInitialPlayerCount } from "./state";

/** The current round, starting with round 1 (i.e. not zero-indexed). */
export const ROUND = new Key("roundNumber", { parse: z.number().parse });

export class RoundEngine {
  protected readonly log = inject(Log);
  protected readonly playerCount = injectInitialPlayerCount();
  protected readonly currentRound = injectState(ROUND);

  start(round: number) {
    this.currentRound.initState(round);
    this.log.log(`Start round #${this.currentRound()}`);
  }

  end(): void {
    this.currentRound.delete();
  }

  isLastRound(roundNumber: number): boolean {
    return roundNumber >= this.maxRounds();
  }

  maxRounds(): number {
    const numPlayers = this.playerCount();

    switch (numPlayers) {
      case 3:
        return 10;
      case 4:
        return 8;
      case 5:
        return 7;
      case 6:
        return 6;
      default:
        assert(false, "unknown number of rounds for player count");
    }
  }
}
