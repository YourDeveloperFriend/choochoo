import { inject, injectState } from "../../engine/framework/execution_context";
import { SetKey } from "../../engine/framework/key";
import { Log } from "../../engine/game/log";
import {
  CURRENT_PLAYER,
  injectCurrentPlayer,
  injectInGamePlayers,
  injectInitialPlayerCount,
} from "../../engine/game/state";
import { ActionBundle } from "../../engine/game/phase_module";
import { SelectActionPhase } from "../../engine/select_action/phase";
import {
  PlayerColor,
  PlayerColorZod,
  PlayerData,
} from "../../engine/state/player";
import { BidAction, BidData } from "../../engine/turn_order/bid";
import { TurnOrderPhase } from "../../engine/turn_order/phase";
import { SkipStrollAction, StrollAction } from "./stroll";

const HAS_BID = new SetKey<PlayerColor>("pittsburghMetroHasBid", {
  parse: PlayerColorZod.parse,
});

export class PittsburghMetroTurnOrderPhase extends TurnOrderPhase {
  private readonly hasBid = injectState(HAS_BID);
  onStart() {
    super.onStart();
    this.hasBid.initState(new Set());
  }
}

export class PittsburghMetroBidAction extends BidAction {
  private readonly playerColor = injectState(CURRENT_PLAYER);
  private readonly hasBid = injectState(HAS_BID);

  process(data: BidData): boolean {
    this.hasBid.update((state) => {
      state.add(this.playerColor());
    });
    return super.process(data);
  }
}

export class PittsburghMetroSelectActionPhase extends SelectActionPhase {
  private readonly hasBid = injectState(HAS_BID);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly inGamePlayers = injectInGamePlayers();
  private readonly playerCount = injectInitialPlayerCount();
  private readonly log = inject(Log);

  configureActions(): void {
    super.configureActions();
    this.installAction(StrollAction);
    this.installAction(SkipStrollAction);
  }

  private getSkippedPlayers(): PlayerData[] {
    // Players who pass without bidding only lose their action in 3 player games.
    if (this.playerCount() !== 3 || !this.hasBid.isInitialized()) {
      return [];
    }
    const hasBid = this.hasBid();
    const nonBidders = this.inGamePlayers().filter(
      (player) => !hasBid.has(player.color),
    );
    if (nonBidders.length > 1) {
      return nonBidders;
    }
    return [];
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

  onEnd() {
    this.hasBid.delete();
    super.onEnd();
  }

  forcedAction(): ActionBundle<object> | undefined {
    // The player already selected Stroll and still needs to perform it.
    if (this.currentPlayer().selectedAction !== undefined) {
      return undefined;
    }
    return super.forcedAction();
  }

  getPlayerOrder(): PlayerColor[] {
    const skipped = this.getSkippedPlayers();
    if (skipped.length > 0) {
      const hasBid = this.hasBid();
      return this.turnOrder().filter((playerColor) => hasBid.has(playerColor));
    }
    return this.turnOrder();
  }
}
