import { MoveAction, MoveData } from "../../engine/move/move";
import { assert } from "../../utils/validate";

export class NewHampshireMoveAction extends MoveAction<MoveData> {
  validate(action: MoveData) {
    super.validate(action);
    for (const pathPart of action.path) {
      assert(pathPart.owner === this.currentPlayer().color, {
        invalidInput: "can only deliver on your own track",
      });
    }
  }
}
