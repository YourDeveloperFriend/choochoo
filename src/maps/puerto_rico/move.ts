import { MoveAction, MoveData } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";

export class PuertoRicoMoveAction extends MoveAction {
  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    if (action.good !== Good.RED) {
      return new Map();
    }
    
    return super.calculateIncome(action);
  }
}