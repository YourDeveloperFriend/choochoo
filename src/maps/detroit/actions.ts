import { Set } from "immutable";
import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { MapKey } from "../../engine/framework/key";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { SkipAction } from "../../engine/select_action/skip";
import { Action, ActionZod } from "../../engine/state/action";
import { assert } from "../../utils/validate";

export const SOLO_ACTION_COUNT = new MapKey(
  "soloActionCount",
  ActionZod.parse,
  z.number().parse,
);

export class DetroitAllowedActions extends AllowedActions {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly soloActionCount = injectState(SOLO_ACTION_COUNT);

  getActions(): Set<Action> {
    if (this.playerCount() === 1) {
      return Set([Action.ENGINEER, Action.LOCOMOTIVE, Action.URBANIZATION]);
    }
    return super.getActions().remove(Action.PRODUCTION);
  }

  getDisabledActionReason(action: Action): string | undefined {
    if (this.playerCount() !== 1) {
      return undefined;
    }
    if (this.soloActionCount().get(action) === 0) {
      return "out of tokens";
    }
    return undefined;
  }
}

export class DetroitSelectAction extends SelectAction {
  private readonly playerCount = injectInitialPlayerCount();
  private readonly soloActionCount = injectState(SOLO_ACTION_COUNT);

  validate(data: SelectData): void {
    assert(
      this.playerCount() !== 1 ||
        this.currentPlayer().money >= this.soloActionCount().get(data.action)!,
      { invalidInput: "Cannot afford to select action" },
    );
    super.validate(data);
  }

  process(data: SelectData): boolean {
    if (this.playerCount() === 1) {
      this.helper.updateCurrentPlayer((player) => {
        player.money -= this.soloActionCount().get(data.action)!;
      });
      this.soloActionCount.update((map) => {
        map.set(data.action, map.get(data.action)! - 1);
      });
    }
    return super.process(data);
  }
}

export class DetroitSelectActionPhase extends SelectActionPhase {
  configureActions() {
    super.configureActions();
    this.installAction(DetroitSkipAction);
  }
}

export class DetroitSkipAction extends SkipAction {
  private readonly playerCount = injectInitialPlayerCount();

  canEmit(): boolean {
    return this.playerCount() === 1;
  }
}
