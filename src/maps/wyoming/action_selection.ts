import { z } from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PlayerHelper } from "../../engine/game/player";
import {
  injectCurrentPlayer,
  injectInitialPlayerCount,
  TURN_ORDER,
} from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectData } from "../../engine/select_action/select";
import {
  Action,
  ActionNamingProvider,
  ActionZod,
} from "../../engine/state/action";
import { assert } from "../../utils/validate";
import { WyomingSelectAction } from "./locomotive";

const WYOMING_DISABLED_ACTION = new Key("wyomingDisabledAction", {
  parse: ActionZod.parse,
});

/** Whether the current player is first in this round's turn order. */
function injectIsFirstPlayerThisRound() {
  const turnOrder = injectState(TURN_ORDER);
  const currentPlayer = injectCurrentPlayer();
  return () => turnOrder()[0] === currentPlayer().color;
}

export function wyomingDisableActionCost(
  action: Action,
  playerCount: number,
): number {
  const isTwoPlayer = playerCount === 2;
  if (action === Action.LOCOMOTIVE) {
    return isTwoPlayer ? 4 : 6;
  }
  return isTwoPlayer ? 2 : 3;
}

export class WyomingAllowedActions extends AllowedActions {
  private readonly disabledAction = injectState(WYOMING_DISABLED_ACTION);

  getDisabledActionReason(action: Action): string | undefined {
    return this.disabledAction.isInitialized() &&
      this.disabledAction() === action
      ? "Disabled this round by the first player to select an action"
      : undefined;
  }
}

export class WyomingSelectActionPhase extends SelectActionPhase {
  private readonly disabledAction = injectState(WYOMING_DISABLED_ACTION);

  configureActions() {
    super.configureActions();
    this.installAction(WyomingDisableAction);
  }

  onStart(): void {
    super.onStart();
    if (this.disabledAction.isInitialized()) {
      this.disabledAction.delete();
    }
  }
}

/**
 * The first player to select an action this round also picks a second,
 * still-available action to disable for everyone (including themselves) for
 * the rest of the round.
 */
export class WyomingActionSelectAction extends WyomingSelectAction {
  private readonly isFirstPlayerThisRound = injectIsFirstPlayerThisRound();

  process(data: SelectData): boolean {
    const isFirstPlayer = this.isFirstPlayerThisRound();
    const result = super.process(data);
    return isFirstPlayer && !data.forced ? false : result;
  }
}

export const DisableActionData = z.object({
  action: ActionZod.optional(),
});
export type DisableActionData = z.infer<typeof DisableActionData>;

export class WyomingDisableAction
  implements ActionProcessor<DisableActionData>
{
  static readonly action = "wyoming-disable-action";

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly playerCount = injectInitialPlayerCount();
  private readonly isFirstPlayerThisRound = injectIsFirstPlayerThisRound();
  private readonly disabledAction = injectState(WYOMING_DISABLED_ACTION);
  private readonly allowedActions = inject(AllowedActions);
  private readonly actionNamingProvider = inject(ActionNamingProvider);
  private readonly playerHelper = inject(PlayerHelper);
  private readonly log = inject(Log);

  readonly assertInput = DisableActionData.parse;

  canEmit(): boolean {
    return (
      this.currentPlayer().selectedAction != null &&
      this.isFirstPlayerThisRound()
    );
  }

  validate(data: DisableActionData): void {
    if (data.action == null) return;
    assert(this.allowedActions.getAvailableActions().has(data.action), {
      invalidInput: "action not available to disable",
    });
    assert(
      this.currentPlayer().money >=
        wyomingDisableActionCost(data.action, this.playerCount()),
      { invalidInput: "Cannot afford to disable this action" },
    );
  }

  process(data: DisableActionData): boolean {
    if (data.action != null) {
      const cost = wyomingDisableActionCost(data.action, this.playerCount());
      this.playerHelper.updateCurrentPlayer((player) => {
        player.money -= cost;
      });
      this.disabledAction.initState(data.action);
      this.log.currentPlayer(
        `spends $${cost} to disable ${this.actionNamingProvider.getActionString(data.action)} for the rest of the round`,
      );
    } else {
      this.log.currentPlayer("chooses not to disable an action this round");
    }
    return true;
  }
}
