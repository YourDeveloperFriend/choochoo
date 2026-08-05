import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionZod } from "../../engine/state/action";

export const WYOMING_INITIAL_DISABLED_ACTION = new Key(
  "wyomingInitialDisabledAction",
  { parse: ActionZod.parse },
);

export class WyomingAllowedActions extends AllowedActions {
  private readonly round = injectState(ROUND);
  private readonly playerCount = injectInitialPlayerCount();
  private readonly initialDisabledAction = injectState(
    WYOMING_INITIAL_DISABLED_ACTION,
  );

  getDisabledActionReason(action: Action): string | undefined {
    if (this.playerCount() !== 3) {
      return super.getDisabledActionReason(action);
    }
    const initial = this.initialDisabledAction();
    const other =
      initial === Action.URBANIZATION ? Action.ENGINEER : Action.URBANIZATION;
    const disabledAction = this.round() % 2 === 1 ? initial : other;
    if (disabledAction === action) {
      return "This action is unavailable this round in a three player game.";
    }
    return super.getDisabledActionReason(action);
  }
}
