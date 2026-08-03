import { Set as ImmutableSet } from "immutable";
import { injectInitialPlayerCount } from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action, ActionNamingProvider } from "../../engine/state/action";

/** The locomotive action only works differently in a three player game. */
export const TEMPORARY_LOCOMOTIVE_PLAYER_COUNT = 3;

export class OahuAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super
      .getActions()
      .remove(Action.TURN_ORDER_PASS)
      .add(Action.TOURIST_TRAP);
  }
}

export class OahuActionNamingProvider extends ActionNamingProvider {
  private readonly playerCount = injectInitialPlayerCount();

  getActionDescription(action: Action): string {
    if (action === Action.PRODUCTION) {
      return "At the end of the turn, move every cube from one column of the goods display into that column's city.";
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
