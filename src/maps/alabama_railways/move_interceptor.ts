import { MoveData } from "../../engine/move/move";
import { AlabamaMoveData } from "./move_good";
import { MoveInterceptor } from "../../engine/move/interceptor";
import { injectCurrentPlayer } from "../../engine/game/state";

export class AlabamaRailwaysMoveInterceptor extends MoveInterceptor {
  private readonly currentPlayer = injectCurrentPlayer();

  public shouldInterceptMove(moveData: MoveData, _cityName: string): boolean {
    const player = this.currentPlayer();

    const hasAChoice =
      player != null &&
      moveData.path.some(({ owner }) => owner !== player.color);
    if (!hasAChoice) {
      (moveData as AlabamaMoveData).forgo = moveData.path[0].owner;
      return false;
    }
    return true;
  }
}
