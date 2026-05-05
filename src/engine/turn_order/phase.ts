import { infiniteLoopCheck } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { AutoActionManager } from "../game/auto_action_manager";
import { Log } from "../game/log";
import { ActionBundle, PhaseModule } from "../game/phase_module";
import { PlayerHelper } from "../game/player";
import {
  injectCurrentPlayer,
  injectInGamePlayers,
  TURN_ORDER,
} from "../game/state";
import { AutoAction } from "../state/auto_action";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { BidAction } from "./bid";
import { TurnOrderHelper } from "./helper";
import { PassAction } from "./pass";
import { TURN_ORDER_STATE } from "./state";
import { TurnOrderPassAction } from "./turn_order_pass";

export class TurnOrderPhase extends PhaseModule {
  static readonly phase = Phase.TURN_ORDER;

  protected readonly players = injectInGamePlayers();
  protected readonly autoAction = inject(AutoActionManager);
  protected readonly currentOrder = injectState(TURN_ORDER);
  protected readonly turnOrderState = injectState(TURN_ORDER_STATE);
  protected readonly helper = inject(TurnOrderHelper);
  protected readonly log = inject(Log);
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly currentPlayer = injectCurrentPlayer();

  configureActions() {
    this.installAction(BidAction);
    this.installAction(PassAction);
    this.installAction(TurnOrderPassAction);
  }

  onStart(): void {
    super.onStart();
    this.turnOrderState.initState({
      nextTurnOrder: [],
      previousBids: {},
      turnOrderPassUsed: false,
    });
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.currentPlayer().outOfGame) {
      return { action: PassAction, data: {} };
    }
    const canAffordBid = this.currentPlayer().money >= this.helper.getMinBid();
    if (!canAffordBid && !this.helper.canUseTurnOrderPass()) {
      return { action: PassAction, data: {} };
    }
    return undefined;
  }

  onEnd(): void {
    super.onEnd();
    const remainingBidders = this.helper.remainingBiddersOrder();
    assert(remainingBidders.length === 1, "expected exactly one bidder");
    this.helper.pass(this.playerHelper.getPlayer(remainingBidders[0]));
    this.currentOrder.set(
      this.turnOrderState().nextTurnOrder.filter(
        (color) => !this.playerHelper.getPlayer(color).outOfGame,
      ),
    );
    this.turnOrderState.delete();
  }

  findNextPlayer(currentColor: PlayerColor): PlayerColor | undefined {
    const currentOrder = this.currentOrder();
    const passedPlayers = new Set(this.turnOrderState().nextTurnOrder);

    if (passedPlayers.size >= currentOrder.length - 1) {
      return undefined;
    }

    const maxBidPlayer = this.helper.getCurrentMaxBidPlayer();

    const infiniteLoop = infiniteLoopCheck(10);
    let nextPlayer = currentColor;
    do {
      infiniteLoop();
      const previousIndex = currentOrder.indexOf(nextPlayer);
      nextPlayer =
        currentOrder[
          previousIndex === currentOrder.length - 1 ? 0 : previousIndex + 1
        ];
      if (nextPlayer === maxBidPlayer) {
        const nextPlayerData = this.players().find(
          ({ color }) => color === nextPlayer,
        )!;
        this.log.player(
          nextPlayerData,
          "does not have to bid against themselves",
        );
      }
    } while (nextPlayer === maxBidPlayer || passedPlayers.has(nextPlayer));
    return nextPlayer;
  }

  protected getAutoAction(
    autoAction: AutoAction,
  ): ActionBundle<object> | undefined {
    if (autoAction.bidUntil == null) return undefined;

    const minBid = this.helper.getMinBid();

    if (minBid <= autoAction.bidUntil.maxBid) {
      return {
        action: BidAction,
        data: {
          bid: autoAction.bidUntil.incrementally
            ? minBid
            : autoAction.bidUntil.maxBid,
        },
      };
    } else if (autoAction.bidUntil.thenPass) {
      return {
        action: PassAction,
        data: {},
      };
    }
    return undefined;
  }
}
