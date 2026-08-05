import { MoveHelper } from "../../engine/move/helper";
import { SelectAction } from "../../engine/select_action/select";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { PlayerData } from "../../engine/state/player";

/**
 * In a two player game, selecting Locomotive doesn't permanently upgrade the
 * engine level; it only grants a temporary +1 during that turn's Move Goods phase.
 */
export class WyomingSelectAction extends SelectAction {
  private readonly playerCount = injectInitialPlayerCount();

  protected applyLocomotive(): void {
    if (this.playerCount() === 2) return;
    super.applyLocomotive();
  }
}

export class WyomingMoveHelper extends MoveHelper {
  private readonly playerCount = injectInitialPlayerCount();

  getLocomotiveDisplay(player: PlayerData): string {
    if (this.hasTemporaryLocomotive(player)) {
      return `${player.locomotive} (+1)`;
    }
    return super.getLocomotiveDisplay(player);
  }

  getLocomotive(player: PlayerData): number {
    const bonus = this.hasTemporaryLocomotive(player) ? 1 : 0;
    return super.getLocomotive(player) + bonus;
  }

  private hasTemporaryLocomotive(player: PlayerData): boolean {
    return (
      this.playerCount() === 2 && player.selectedAction === Action.LOCOMOTIVE
    );
  }
}
