import { MoveData } from "../../engine/move/move";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

export class MoonMoveInterceptor extends MoveInterceptor {
  private readonly currentPlayer = injectCurrentPlayer();

  public shouldInterceptMove(moveData: MoveData, _cityName: string): boolean {
    const player = this.currentPlayer();

    const hasAChoice =
      player != null &&
      moveData.path.some(({ owner }) => owner !== player.color);
    if (hasAChoice && player.selectedAction === Action.LOW_GRAVITATION) {
      return true;
    }
    return false;
  }
}
