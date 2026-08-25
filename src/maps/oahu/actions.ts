import { Set as ImmutableSet } from "immutable";
import { injectState } from "../../engine/framework/execution_context";
import {
  injectCurrentPlayer,
  injectInitialPlayerCount,
  TURN_ORDER,
} from "../../engine/game/state";
import { ActionBundle } from "../../engine/game/phase_module";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { OahuProductionAction } from "./production";

/** The locomotive action only works differently in a three player game. */
export const TEMPORARY_LOCOMOTIVE_PLAYER_COUNT = 3;

export class OahuAllowedActions extends AllowedActions {
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly turnOrder = injectState(TURN_ORDER);

  getActions(): ImmutableSet<Action> {
    if (this.mustSelectProduction()) {
      return ImmutableSet([Action.PRODUCTION]);
    }
    return super.getActions().add(Action.TOURIST_TRAP);
  }

  /**
   * The player last in turn order must take Production if nobody has chosen
   * it yet, so they are only offered that single action.
   */
  private mustSelectProduction(): boolean {
    const order = this.turnOrder();
    const isLastPlayer =
      order.length > 0 &&
      order[order.length - 1] === this.currentPlayer().color;
    if (!isLastPlayer) return false;
    return !this.players().some(
      (player) => player.selectedAction === Action.PRODUCTION,
    );
  }
}

/**
 * Production happens immediately when the action is selected (see
 * OahuSelectAction), so once the player has picked an action there is
 * nothing left to force: either they are done, or they are mid-production
 * and must click a column of the goods display next.
 */
export class OahuSelectActionPhase extends SelectActionPhase {
  private readonly currentPlayer = injectCurrentPlayer();

  configureActions(): void {
    super.configureActions();
    this.installAction(OahuProductionAction);
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.currentPlayer().selectedAction !== undefined) {
      return undefined;
    }
    return super.forcedAction();
  }
}

export class OahuActionNamingProvider extends ActionNamingProvider {
  private readonly playerCount = injectInitialPlayerCount();

  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "Immediately select one column of the goods display: one cube moves to that column's Starting City, and the other cube in the column moves to the New City.";
    }
    if (
      action === Action.LOCOMOTIVE &&
      this.playerCount() === TEMPORARY_LOCOMOTIVE_PLAYER_COUNT
    ) {
      return "Your engine level is temporarily increased by one during the Move Goods phase.";
    }
    return super.getActionDescription(action);
  }
}

export class OahuSelectAction extends SelectAction {
  private readonly playerCount = injectInitialPlayerCount();

  /**
   * In a three player game the locomotive action grants a temporary boost during
   * the Move Goods phase (see OahuMoveHelper) rather than a permanent increase.
   */
  protected applyLocomotive(): void {
    if (this.playerCount() === TEMPORARY_LOCOMOTIVE_PLAYER_COUNT) return;
    super.applyLocomotive();
  }

  process(data: SelectData): boolean {
    const result = super.process(data);
    if (data.action === Action.TOURIST_TRAP) {
      this.applyTouristTrap();
    }
    if (data.action === Action.PRODUCTION) {
      return false;
    }
    return result;
  }

  private applyTouristTrap(): void {
    const taker = this.currentPlayer().color;
    let collected = 0;
    this.helper.updateInGamePlayers((player) => {
      if (player.color === taker) return;
      // Players with no cash on hand pay nothing.
      if (player.money < 1) return;
      player.money--;
      collected++;
    });
    this.helper.update(taker, (player) => {
      player.money += collected;
    });
    this.log.currentPlayer(`collects $${collected} from the tourist trap`);
  }
}
