import { Set as ImmutableSet } from "immutable";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import {
  injectInGamePlayers,
  injectInitialPlayerCount,
} from "../../engine/game/state";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { SelectAction, SelectData } from "../../engine/select_action/select";
import { Action } from "../../engine/state/action";
import { Phase, PhaseNamingProvider } from "../../engine/state/phase";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { HAS_BID } from "./auction";
import { RepairCrewAction } from "./repair_crew";
import { TrainHelper } from "./trains";

const ISLE_OF_WIGHT_ACTIONS = ImmutableSet([
  Action.FIRST_MOVE,
  Action.FIRST_BUILD,
  Action.URBANIZATION,
  Action.REPAIR_CREW,
  Action.HAGGLE,
]);

export class IsleOfWightAllowedActions extends AllowedActions {
  private readonly playerCount = injectInitialPlayerCount();

  getActions(): ImmutableSet<Action> {
    // Turn Order Pass is only available at 4+
    if (this.playerCount() < 4) {
      return ISLE_OF_WIGHT_ACTIONS;
    }
    return ISLE_OF_WIGHT_ACTIONS.add(Action.TURN_ORDER_PASS);
  }
}

export class IsleOfWightSelectAction extends SelectAction {
  private readonly trainHelper = inject(TrainHelper);

  canEmit(): boolean {
    return this.currentPlayer().selectedAction === undefined;
  }

  process(data: SelectData): boolean {
    const result = super.process(data);
    if (data.action === Action.HAGGLE) {
      this.trainHelper.grantCoupon(this.currentPlayer().color);
      this.log.currentPlayer("receives a Haggle coupon");
      return result;
    }
    if (data.action === Action.REPAIR_CREW) {
      const hasGoods = this.trainHelper
        .trainsFor(this.currentPlayer().color)
        .some((card) => card.goods.length > 0);
      if (!hasGoods) {
        this.log.currentPlayer("has no goods to remove from their trains");
        return result;
      }
      return false;
    }
    return result;
  }
}

export class IsleOfWightSelectActionPhase extends SelectActionPhase {
  private readonly hasBid = injectState(HAS_BID);
  private readonly inGamePlayers = injectInGamePlayers();
  private readonly playerCount = injectInitialPlayerCount();
  private readonly log = inject(Log);

  configureActions(): void {
    super.configureActions();
    this.installAction(RepairCrewAction);
  }

  /**
   * The Montréal rule, which this map uses at three players only: players who
   * passed the auction without bidding do not select a role, so long as at
   * least two of them did so.
   */
  private getSkippedPlayers(): PlayerData[] {
    if (this.playerCount() !== 3) return [];
    const hasBid = this.hasBid();
    const nonBidders = this.inGamePlayers().filter(
      (player) => !hasBid.has(player.color),
    );
    return nonBidders.length > 1 ? nonBidders : [];
  }

  onStart(): void {
    super.onStart();
    for (const nonBidder of this.getSkippedPlayers()) {
      this.log.player(
        nonBidder,
        "will not get an action because they did not bid",
      );
    }
  }

  getPlayerOrder(): PlayerColor[] {
    if (this.getSkippedPlayers().length === 0) {
      return this.turnOrder();
    }
    const hasBid = this.hasBid();
    return this.turnOrder().filter((playerColor) => hasBid.has(playerColor));
  }

  onEnd(): void {
    this.hasBid.delete();
    super.onEnd();
  }
}

export class IsleOfWightPhaseNamingProvider extends PhaseNamingProvider {
  getPhaseString(phase: Phase): string {
    // The map borrows Stalinist Russia's extra phase for its own purchasing step.
    if (phase === Phase.STALINIST_LOCOMOTIVE) {
      return "Buy trains";
    }
    return super.getPhaseString(phase);
  }
}
