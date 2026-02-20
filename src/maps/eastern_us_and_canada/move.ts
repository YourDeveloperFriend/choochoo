import { MoveHelper } from "../../engine/move/helper";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

export class EasternUsAndCanadaMoveHelper extends MoveHelper {
  private readonly currentPlayer = injectCurrentPlayer();

  canMoveThrough(city: City, good: Good): boolean {
    const player = this.currentPlayer();
    if (player.selectedAction === Action.MARKETING) {
      return true;
    }
    return super.canMoveThrough(city, good);
  }
}
