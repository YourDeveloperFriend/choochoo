import { injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { MoveHelper } from "../../engine/move/helper";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerData } from "../../engine/state/player";
import { TEMPORARY_LOCOMOTIVE_PLAYER_COUNT } from "./actions";

export class OahuMoveHelper extends MoveHelper {
  private readonly phase = injectState(PHASE);
  private readonly playerCount = injectInitialPlayerCount();

  getLocomotiveDisplay(player: PlayerData): string {
    if (this.hasTemporaryLocomotive(player)) {
      return `${player.locomotive} (+1)`;
    }
    return super.getLocomotiveDisplay(player);
  }

  getLocomotive(player: PlayerData): number {
    const offset = this.hasTemporaryLocomotive(player) ? 1 : 0;
    return super.getLocomotive(player) + offset;
  }

  private hasTemporaryLocomotive(player: PlayerData): boolean {
    if (this.playerCount() !== TEMPORARY_LOCOMOTIVE_PLAYER_COUNT) {
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
