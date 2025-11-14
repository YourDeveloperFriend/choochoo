import { injectState } from "../../engine/framework/execution_context";
import { RoundEngine } from "../../engine/game/round";
import { TURN_ORDER } from "../../engine/game/state";
import { assert } from "../../utils/validate";

export class BelgiumRoundEngine extends RoundEngine {
  private readonly turnOrder = injectState(TURN_ORDER);

  start(round: number): void {
    super.start(round);

    const priorTurnOrder = this.turnOrder();
    assert(priorTurnOrder.length === 2);
    const newTurnOrder = [priorTurnOrder[1], priorTurnOrder[0]];
    this.turnOrder.set(newTurnOrder);
  }

  maxRounds(): number {
    return 8;
  }
}
