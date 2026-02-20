import { MoveData } from "../../engine/move/move";
import { MoveAction } from "../../engine/move/move";
import { Good } from "../../engine/state/good";
import { inject } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { PlayerHelper } from "../../engine/game/player";
import { PlayerColor } from "../../engine/state/player";

export class SouthernUSMoveAction extends MoveAction<MoveData> {
  protected readonly log = inject(Log);
  protected readonly playerHelper = inject(PlayerHelper);

  calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
    const income = super.calculateIncome(action);

    if (action.good === Good.WHITE) {
      const currentPlayerColor = this.currentPlayer().color;
      const currentIncome = income.get(currentPlayerColor) || 0;
      income.set(currentPlayerColor, currentIncome + 1);
    }

    return income;
  }

  protected returnToBag(action: MoveData): void {
    if (action.good !== Good.WHITE) {
      super.returnToBag(action);
    }
  }
}
