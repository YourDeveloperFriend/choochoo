import { inject } from "../framework/execution_context";
import { AutoActionManager } from "../game/auto_action_manager";
import { ActionBundle, PhaseModule } from "../game/phase_module";
import { injectAllPlayersUnsafe } from "../game/state";
import { AutoAction } from "../state/auto_action";
import { Phase } from "../state/phase";
import { AllowedActions } from "./allowed_actions";
import { SelectAction } from "./select";
import { SkipAction } from "./skip";

export class SelectActionPhase extends PhaseModule {
  static readonly phase = Phase.ACTION_SELECTION;

  protected readonly players = injectAllPlayersUnsafe();
  protected readonly autoActionManager = inject(AutoActionManager);
  protected readonly allowedActions = inject(AllowedActions);

  configureActions() {
    this.installAction(SelectAction);
  }

  onStart(): void {
    this.players.update((players) => {
      for (const player of players) {
        delete player.selectedAction;
      }
    });
    super.onStart();
  }

  onEndTurn(): void {
    this.autoActionManager.mutateCurrentPlayer((autoAction) => {
      autoAction.takeActionNext = undefined;
    });
    super.onEndTurn();
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (
      this.allowedActions.getAvailableActions().size === 0 &&
      this.canEmit(SkipAction)
    ) {
      return {
        action: SkipAction,
        data: { forced: true },
      };
    }
    if (this.allowedActions.getAvailableActions().size === 1) {
      const action = this.allowedActions
        .getAvailableActions()
        [Symbol.iterator]()
        .next().value;
      return {
        action: SelectAction,
        data: { action, forced: true },
      };
    }
  }

  protected getAutoAction(
    autoAction: AutoAction,
  ): ActionBundle<object> | undefined {
    if (autoAction.takeActionNext == null) return undefined;

    if (
      this.allowedActions.getAvailableActions().has(autoAction.takeActionNext)
    ) {
      return {
        action: SelectAction,
        data: { action: autoAction.takeActionNext },
      };
    }
    return undefined;
  }
}
