import { MoveAction, MoveData } from "../../engine/move/move";
import { assert } from "../../utils/validate";

export class DetroitMoveAction extends MoveAction {
  validate(action: MoveData): void {
    const ownedByPlayer = action.path.filter(
      ({ owner }) => owner === this.currentPlayer().color,
    );
    assert(ownedByPlayer.length >= action.path.length / 2, {
      invalidInput: "Must own at least half of the route",
    });
    super.validate(action);
  }
}
