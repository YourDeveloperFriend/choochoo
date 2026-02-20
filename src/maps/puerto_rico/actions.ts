import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action } from "../../engine/state/action";
import { ImmutableSet } from "../../utils/immutable";
import { assert } from "../../utils/validate";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SkipAction } from "../../engine/select_action/skip";

export class PuertoRicoSelectActionPhase extends SelectActionPhase {
  configureActions() {
    super.configureActions();
    this.installAction(PuertoRicoSkipAction);
  }
}

export class PuertoRicoSkipAction extends SkipAction {
  canEmit(): boolean {
    return true;
  }
}

export class PuertoRicoActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return ImmutableSet([Action.LOCOMOTIVE, Action.ENGINEER]);
  }
}

export class PuertoRicoSelectAction extends SelectAction {
  validate(data: SelectData): void {
    assert(this.currentPlayer().money >= 5, {
      invalidInput: "Cannot afford to select action (costs $5)",
    });
    super.validate(data);
  }

  process(data: SelectData): boolean {
    this.helper.updateCurrentPlayer((player) => {
      player.money -= 5;
    });
    return super.process(data);
  }
}
