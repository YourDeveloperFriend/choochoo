import { MoveAction, MoveData } from "../../engine/move/move";
import { PlayerColor } from "../../engine/state/player";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";

export class VermontMoveAction extends MoveAction<MoveData> {
  private readonly currentRound = injectState(ROUND);

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
