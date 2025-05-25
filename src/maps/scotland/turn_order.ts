import { injectState } from "../../engine/framework/execution_context";
import { RoundEngine } from "../../engine/game/round";
import { injectPlayerAction, TURN_ORDER,} from "../../engine/game/state";
import { Action } from "../../engine/state/action";


export class ScotlandRoundEngine extends RoundEngine {
  protected readonly turnOrder = injectState(TURN_ORDER);
  private readonly turnOrderPass = injectPlayerAction(Action.TURN_ORDER_PASS);
  
  start(round: number): void {
        const realFirstPlayer = this.turnOrderPass();
        if (realFirstPlayer != null) {
            
            const otherPlayer = this.turnOrder()[0] === realFirstPlayer.color
            ? this.turnOrder()[1]
            : this.turnOrder()[0];

            this.turnOrder.set([
            realFirstPlayer.color,
            otherPlayer,
            ]);
        } 
        return super.start(round);
    }
  
  maxRounds(): number {
    return 8;
  }
}