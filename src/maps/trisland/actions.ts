import z from "zod";
import { DoneAction } from "../../engine/build/done";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { Log } from "../../engine/game/log";
import { injectCurrentPlayer } from "../../engine/game/state";
import { PassAction } from "../../engine/goods_growth/pass";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action, ActionZod } from "../../engine/state/action";
import { PlayerColorZod } from "../../engine/state/player";
import { assert, fail } from "../../utils/validate";

const ActionRemaining = z.object({
  action: ActionZod,
  remaining: z.number(),
});

const ActionsRemainingForPlayer = z.object({
  player: PlayerColorZod,
  actions: ActionRemaining.array(),
});
const ActionsRemaining = ActionsRemainingForPlayer.array();
type ActionsRemaining = z.infer<typeof ActionsRemaining>;

export const ACTIONS_REMAINING = new Key("actionsRemaining", {
  parse: ActionsRemaining.parse,
});

export class TrislandAvailableActions extends AllowedActions {
  private readonly actionsRemaining = injectState(ACTIONS_REMAINING);
  private readonly currentPlayer = injectCurrentPlayer();

  getDisabledActionReason(action: Action): string | undefined {
    const numRemaining = this.actionsRemaining()
      .find(({ player }) => player === this.currentPlayer().color)!
      .actions.find((d) => d.action === action)!.remaining;
    if (numRemaining === 0) {
      return "no more tokens remaining to select this action";
    }
    return undefined;
  }
}

export class TrislandSelectActionPhase extends SelectActionPhase {
  private readonly log = inject(Log);
  checkSkipTurn(): boolean {
    if (this.allowedActions.getAvailableActions().size === 0) {
      this.log.currentPlayer(
        "forgoes action selection because there are no available actions",
      );
      return true;
    }
    return false;
  }
}

export class TrislandSelectAction extends SelectAction {
  private readonly actionsRemaining = injectState(ACTIONS_REMAINING);

  process(data: SelectData): boolean {
    this.actionsRemaining.update((actions) => {
      const actionValue = actions
        .find(({ player }) => player === this.currentPlayer().color)!
        .actions.find(({ action }) => action === data.action)!;
      actionValue.remaining--;
    });
    return super.process(data);
  }
}

export class TrislandBuildDoneAction extends DoneAction {
  private readonly player = injectCurrentPlayer();

  validate(): void {
    super.validate();
    assert(this.player().selectedAction !== Action.ENGINEER, {
      invalidInput:
        "Engineer must build until there are no buildable options left",
    });

    assert(!this.helper.canUrbanize(), {
      invalidInput: "You cannot pass without urbanizing",
    });
  }
}

export class TrislandProductionPassAction extends PassAction {
  validate(): void {
    fail({
      invalidInput: "You must place drawn cubes",
    });
  }
}
