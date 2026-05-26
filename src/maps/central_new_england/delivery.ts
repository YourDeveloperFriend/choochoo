import { MoveAction, MoveData } from "../../engine/move/move";
import { PlayerColor } from "../../engine/state/player";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { assert } from "../../utils/validate";
import { CentralNewEnglandMapData } from "./grid";
import { Action } from "../../engine/state/action";

export class CentralNewEnglandMoveAction extends MoveAction<MoveData> {
  private readonly currentRound = injectState(ROUND);

  validate(action: MoveData) {
    super.validate(action);
    for (const pathPart of action.path) {
      assert(pathPart.owner === this.currentPlayer().color, {
        invalidInput: "can only deliver on your own track",
      });
    }

    if (this.currentPlayer().selectedAction !== Action.SMUGGLE) {
      const startingState = this.grid()
        .get(action.startingCity)
        ?.getMapSpecific(CentralNewEnglandMapData.parse)?.state;
      assert(startingState !== undefined, {
        invalidInput: "invalid starting coordinate",
      });
      const endState = this.grid()
        .get(action.path[action.path.length - 1].endingStop)
        ?.getMapSpecific(CentralNewEnglandMapData.parse)?.state;
      assert(endState !== undefined, {
        invalidInput: "invalid ending coordinate",
      });
      assert(startingState !== endState, {
        invalidInput: "delivery must end in a different state than it started",
      });
    }
  }

  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    const baseIncome = super.calculateIncome(action);

    if (this.currentRound() % 2 === 1) {
      const lastPlayerColor = action.path[action.path.length - 1].owner;
      if (lastPlayerColor !== undefined) {
        baseIncome.set(
          lastPlayerColor,
          (baseIncome.get(lastPlayerColor) || 0) + 1,
        );
      }
    }

    return baseIncome;
  }
}
