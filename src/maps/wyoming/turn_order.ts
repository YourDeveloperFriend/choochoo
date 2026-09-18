import { injectState } from "../../engine/framework/execution_context";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { TurnOrderPhase } from "../../engine/turn_order/phase";
import { WyomingLocoDiscs } from "./locomotive";

/** In a two player game, the winner of the turn order auction gets a free loco disc. */
export class WyomingTurnOrderPhase extends TurnOrderPhase {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  onEnd(): void {
    super.onEnd();
    if (this.playerCount() !== 2) return;

    const winner = this.currentOrder()[0];
    this.locoDiscs.update((discs) => {
      discs.set(winner, (discs.get(winner) ?? 0) + 1);
    });
    this.log.player(
      this.players().find((player) => player.color === winner)!,
      "gains a free loco disc for winning the turn order auction",
    );
  }
}
