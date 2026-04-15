import { MoveHelper } from "../../engine/move/helper";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { GameMemory } from "../../engine/game/game_memory";
import { PlayerData } from "../../engine/state/player";
import { Phase } from "../../engine/state/phase";
import { Action } from "../../engine/state/action";
import { SelectAction } from "../../engine/select_action/select";

export class JapanSelectAction extends SelectAction {
  protected applyLocomotive(): void {}
}

export class JapanMoveHelper extends MoveHelper {
  private readonly phase = injectState(PHASE);
  private readonly gameMemory = inject(GameMemory);

  getLocomotiveDisplay(player: PlayerData): string {
    if (this.canUseLoco(player)) {
      return `${player.locomotive} (+1)`;
    }
    return super.getLocomotiveDisplay(player);
  }

  getLocomotive(player: PlayerData): number {
    const offset = this.canUseLoco(player) ? 1 : 0;
    return super.getLocomotive(player) + offset;
  }

  private canUseLoco(player: PlayerData): boolean {
    switch (this.phase()) {
      case Phase.MOVING:
      case Phase.ACTION_SELECTION:
      case Phase.BUILDING:
        return player.selectedAction === Action.LOCOMOTIVE;
      default:
        return false;
    }
  }
}
