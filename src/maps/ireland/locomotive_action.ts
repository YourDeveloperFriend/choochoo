import { IrelandVariantConfig } from "../../api/variant_config";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { PHASE } from "../../engine/game/phase";
import { MoveHelper } from "../../engine/move/helper";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerData } from "../../engine/state/player";

export class IrelandMoveHelper extends MoveHelper {
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
    if (!this.gameMemory.getVariant(IrelandVariantConfig.parse).locoVariant) {
      return false;
    }
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
