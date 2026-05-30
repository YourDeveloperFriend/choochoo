import { inject } from "../../engine/framework/execution_context";
import { MoveAction, MoveData } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { assert } from "../../utils/validate";
import { MexicoRoleHelper } from "./roles";

export class MexicoMoveAction extends MoveAction<MoveData> {
  private readonly roles = inject(MexicoRoleHelper);

  validate(action: MoveData): void {
    super.validate(action);
    const color = this.currentPlayer().color;
    if (this.roles.isState(color)) {
      assert(action.good !== Good.RED, {
        invalidInput: "The State cannot move red goods",
      });
    } else {
      assert(action.good !== Good.BLACK, {
        invalidInput: "The Cartel cannot move black goods",
      });
    }
  }
}
