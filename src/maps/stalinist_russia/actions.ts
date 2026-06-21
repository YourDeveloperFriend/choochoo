import { Set as ImmutableSet } from "immutable";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction } from "../../engine/select_action/select";
import { Action, ActionNamingProvider } from "../../engine/state/action";

export class StalinistRussiaAllowedActions extends AllowedActions {
  private readonly playerCount = injectInitialPlayerCount();

  getActions(): ImmutableSet<Action> {
    let actions = super.getActions().add(Action.POLITBURO_DIRECTIVE);
    // The Engineer action is only available at five players.
    if (this.playerCount() !== 5) {
      actions = actions.delete(Action.ENGINEER);
    }
    return actions;
  }
}

export class StalinistRussiaSelectAction extends SelectAction {
  protected applyLocomotive(): void {
    // The Locomotive action does not immediately raise the locomotive on this
    // map. Instead it grants going first during the dedicated locomotive phase.
  }
}

export class StalinistRussiaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Go first during the Locomotive phase.";
    }
    return super.getActionDescription(action);
  }
}
