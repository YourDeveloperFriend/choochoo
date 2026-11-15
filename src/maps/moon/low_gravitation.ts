import { Set } from "immutable";
import z from "zod";
import { injectPlayerAction } from "../../engine/game/state";
import { MoveAction, MoveData } from "../../engine/move/move";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { assert } from "../../utils/validate";

export class MoonAllowedActions extends AllowedActions {
  getActions(): Set<Action> {
    return super.getActions().add(Action.LOW_GRAVITATION);
  }
}

export const MoonMoveData = MoveData.extend({
  stealFrom: z.object({ color: PlayerColorZod.optional() }).optional(),
});
export type MoonMoveData = z.infer<typeof MoonMoveData>;

export class MoonMoveAction extends MoveAction<MoonMoveData> {
  private readonly lowGravitation = injectPlayerAction(Action.LOW_GRAVITATION);

  assertInput(data: unknown): MoonMoveData {
    return MoonMoveData.parse(data);
  }

  hasLowGravitation(): boolean {
    return this.currentPlayer().color === this.lowGravitation()?.color;
  }

  validate(action: MoonMoveData): void {
    super.validate(action);
    const { stealFrom } = action;
    if (stealFrom == null) {
      return;
    }
    assert(this.hasLowGravitation(), {
      invalidInput: "Can only steal with low gravitation",
    });
    assert(
      action.path.some((p) => p.owner === stealFrom.color),
      {
        invalidInput: "stealFrom must be in path",
      },
    );
  }

  calculateIncome(action: MoonMoveData): Map<PlayerColor | undefined, number> {
    const { stealFrom } = action;
    const income = super.calculateIncome(action);
    if (stealFrom != null) {
      income.set(stealFrom.color, income.get(stealFrom.color)! - 1);
      income.set(
        this.currentPlayer().color,
        (income.get(this.currentPlayer().color) ?? 0) + 1,
      );
    }
    return income;
  }
}
