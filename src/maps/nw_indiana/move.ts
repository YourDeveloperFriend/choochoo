import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { Good } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { CHICAGO_SAME_CITY } from "./grid";

export class NwIndianaMoveHelper extends MoveHelper {
  private readonly round = injectState(ROUND);

  canMoveThrough(city: City, good: Good): boolean {
    if (city.data.sameCity === CHICAGO_SAME_CITY) {
      return false;
    }
    return super.canMoveThrough(city, good);
  }

  getLocomotiveDisplay(player: PlayerData): string {
    if (this.isConstruction()) {
      return `${super.getLocomotive(player)} (-1)`;
    }
    return super.getLocomotiveDisplay(player);
  }

  getLocomotive(player: PlayerData): number {
    const locomotive = super.getLocomotive(player);
    if (this.isConstruction()) {
      return Math.max(0, locomotive - 1);
    }
    return locomotive;
  }

  private isConstruction(): boolean {
    return this.round() % 2 === 1;
  }
}
