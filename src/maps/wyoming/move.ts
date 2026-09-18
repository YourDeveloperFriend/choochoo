import { injectState } from "../../engine/framework/execution_context";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { MoveAction, MoveData } from "../../engine/move/move";
import { WyomingLocoDiscs } from "./locomotive";

/** In a two player game, deliveries beyond the player's locomotive value spend loco discs. */
export class WyomingMoveAction extends MoveAction {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly locoDiscs = injectState(WyomingLocoDiscs);

  process(action: MoveData): boolean {
    const result = super.process(action);
    if (this.playerCount() !== 2) return result;

    const currentPlayer = this.currentPlayer();
    const excessLoco =
      action.path.length - this.moveHelper.getLocomotive(currentPlayer);
    if (excessLoco > 0) {
      this.locoDiscs.update((discs) => {
        discs.set(
          currentPlayer.color,
          (discs.get(currentPlayer.color) ?? 0) - excessLoco,
        );
      });
      this.log.currentPlayer(`spends ${excessLoco} loco discs`);
    }
    return result;
  }
}
