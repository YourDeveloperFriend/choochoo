import { injectState } from "../../engine/framework/execution_context";
import { RoundEngine } from "../../engine/game/round";
import { GameStarter } from "../../engine/game/starter";
import { TURN_ORDER } from "../../engine/game/state";
import { PlayerColor } from "../../engine/state/player";

export class NewEnglandStarter extends GameStarter {
  eligiblePlayerColors(): PlayerColor[] {
    return [PlayerColor.WHITE, PlayerColor.BLACK];
  }
}

export class NewEnglandRoundEngine extends RoundEngine {
  private readonly turnOrder = injectState(TURN_ORDER);

  start(round: number): void {
    super.start(round);
    this.turnOrder.set(getTurnOrder(round));
  }

  maxRounds(): number {
    return 8;
  }
}

function getTurnOrder(round: number): PlayerColor[] {
  switch (round) {
    case 2:
    case 4:
    case 5:
    case 7:
      return [PlayerColor.BLACK, PlayerColor.WHITE];
    case 1:
    case 3:
    case 6:
    case 8:
      return [PlayerColor.WHITE, PlayerColor.BLACK];
    default:
      throw new Error("Invalid round number");
  }
}
