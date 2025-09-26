import { MoveHelper } from "../../engine/move/helper";
import { City } from "../../engine/map/city";
import { Good } from "../../engine/state/good";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Action } from "../../engine/state/action";

export class RustBeltExpressMoveHelper extends MoveHelper {
  private readonly currentPlayer = injectCurrentPlayer();

  canDeliverTo(city: City, good: Good): boolean {
    if (city.name() === "Pittsburgh") {
      return true;
    }
    return super.canDeliverTo(city, good);
  }

  canMoveThrough(city: City, good: Good): boolean {
    const player = this.currentPlayer();
    if (player.selectedAction === Action.FIRST_MOVE && player.money >= 2) {
      return true;
    }
    return super.canMoveThrough(city, good);
  }
}
