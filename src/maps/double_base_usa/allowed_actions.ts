import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";
import { injectInitialPlayerCount } from "../../engine/game/state";

export class DoubleBaseUsaAllowedActions extends AllowedActions {
  private readonly playerCount = injectInitialPlayerCount();

  getActions(): ImmutableSet<Action> {
    let actions = super.getActions();
    if (this.playerCount() >= 6) {
      actions = actions.add(Action.DOUBLE_BASE_LOCOMOTIVE);
    }
    return actions;
  }
}

export class DoubleBaseUsaActionNamingProvider extends ActionNamingProvider {
  getActionDescription(action: Action): string {
    if (action === Action.LOCOMOTIVE) {
      return "Immediately receive two bonus locomotive discs.";
    }
    if (action === Action.PRODUCTION) {
      return "Immediately draw two cubes from the bag and then place one of them on a non-numbered city of your choice.";
    }
    return super.getActionDescription(action);
  }
}
