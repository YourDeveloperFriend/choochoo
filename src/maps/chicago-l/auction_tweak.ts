import { inject, injectState } from "../../engine/framework/execution_context";
import { SetKey } from "../../engine/framework/key";
import { Log } from "../../engine/game/log";
import {
  CURRENT_PLAYER,
  injectCurrentPlayer,
  injectInGamePlayers,
} from "../../engine/game/state";
import { SelectActionPhase } from "../../engine/select_action/phase";
import {
  PlayerColor,
  PlayerColorZod,
  PlayerData,
} from "../../engine/state/player";
import { BidAction, BidData } from "../../engine/turn_order/bid";
import { TurnOrderPhase } from "../../engine/turn_order/phase";
import { RepopulateAction } from "./repopulation/repopulate";

const HAS_BID = new SetKey<PlayerColor>("CHICAGOL_HAS_BID", {
  parse: PlayerColorZod.parse,
});

export class ChicagoLTurnOrderPhase extends TurnOrderPhase {
  private readonly hasBid = injectState(HAS_BID);
  onStart() {
    super.onStart();
    this.hasBid.initState(new Set());
  }
}

export class ChicagoLBidAction extends BidAction {
  private readonly playerColor = injectState(CURRENT_PLAYER);
  private readonly hasBid = injectState(HAS_BID);

  process(data: BidData): boolean {
    this.hasBid.update((state) => {
      state.add(this.playerColor());
    });
    return super.process(data);
  }
}

export class ChicagoLSelectActionPhase extends SelectActionPhase {
  private readonly hasBid = injectState(HAS_BID);
  protected readonly currentPlayer = injectCurrentPlayer();
  private readonly inGamePlayers = injectInGamePlayers();
  private readonly log = inject(Log);

  configureActions(): void {
    super.configureActions();
    this.installAction(RepopulateAction);
  }

  private getSkippedPlayers(): PlayerData[] {
    const hasBid = this.hasBid();
    // Per https://boardgamegeek.com/thread/3538513/how-to-handle-player-elimination
    // You only count in game players.
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

  getPlayerOrder(): PlayerColor[] {
    const hasBid = this.hasBid();
    if (this.getSkippedPlayers().length > 0) {
      return this.turnOrder().filter((playerColor) => hasBid.has(playerColor));
    }
    return this.turnOrder();
  }
}
