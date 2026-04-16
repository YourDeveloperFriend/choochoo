import { z } from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionBundle } from "../../engine/game/phase_module";
import { EmptyAction } from "../../engine/game/action";
import { injectCurrentPlayer } from "../../engine/game/state";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePhase } from "../../engine/move/phase";
import { MovePassAction } from "../../engine/move/pass";
import { MoveSearcher } from "../../engine/move/searcher";
import { MoveValidator, RouteInfo } from "../../engine/move/validator";
import { Coordinates } from "../../utils/coordinates";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";

// ---------------------------------------------------------------------------
// State: track which players have passed consecutively in this delivery phase.
// When a player makes a delivery, the list resets — everyone must pass again.
// The phase ends only when ALL players appear in this list.
// ---------------------------------------------------------------------------

const FourLocoPassState = z.object({
  passedPlayers: z.array(z.nativeEnum(PlayerColor)),
});
type FourLocoPassState = z.infer<typeof FourLocoPassState>;

export const FOUR_LOCO_PASS_STATE = new Key("fourLocoPassState", {
  parse: FourLocoPassState.parse,
});

// ---------------------------------------------------------------------------
// FourLocoMovePhase
// Overrides the delivery phase to allow unlimited rounds until all players
// pass consecutively.
// ---------------------------------------------------------------------------

export class FourLocoMovePhase extends MovePhase {
  private readonly fourLocoPassState = injectState(FOUR_LOCO_PASS_STATE);
  private readonly moveSearcher = inject(MoveSearcher);
  private readonly currentPlayer = injectCurrentPlayer();

  configureActions() {
    // Install our overridden pass and move actions; skip LocoAction
    this.installAction(FourLocoMoveAction);
    this.installAction(FourLocoMovePassAction);
  }

  onStart(): void {
    super.onStart();
    this.fourLocoPassState.initState({ passedPlayers: [] });
  }

  onEnd(): void {
    this.fourLocoPassState.delete();
    super.onEnd();
  }

  /**
   * We don't use the standard "numMoveRounds" mechanism — our cycling logic
   * is handled entirely via findNextPlayer. Return 1 so the base class never
   * bumps the round counter prematurely.
   */
  numMoveRounds(): number {
    return 1;
  }

  /**
   * After each turn the engine asks for the next player. We keep cycling
   * through the full turn order until every player has passed consecutively
   * (i.e., no delivery was made since the last reset of passedPlayers).
   */
  findNextPlayer(currPlayer: PlayerColor): PlayerColor | undefined {
    const next = super.findNextPlayer(currPlayer);
    if (next != null) {
      return next;
    }

    // We've reached the end of one cycle through turn order.
    const playerOrder = this.getPlayerOrder();
    const passed = this.fourLocoPassState().passedPlayers;

    // If every player in the order appears in passedPlayers, we're done.
    if (playerOrder.every((p) => passed.includes(p))) {
      return undefined;
    }

    // Otherwise continue with another round starting from the first player.
    return playerOrder[0];
  }

  /**
   * Auto-pass when the current player has no valid 4-link deliveries.
   * This avoids requiring players to manually click Pass when they're stuck.
   */
  forcedAction(): ActionBundle<object> | undefined {
    const player = this.currentPlayer();
    const validRoutes = this.moveSearcher.findAllRoutes(player);
    if (validRoutes.length === 0) {
      return { action: FourLocoMovePassAction, data: {} };
    }
    return undefined;
  }

  /** Called by FourLocoMovePassAction to record this player's pass. */
  recordPass(player: PlayerColor): void {
    this.fourLocoPassState.update((state) => {
      if (!state.passedPlayers.includes(player)) {
        state.passedPlayers.push(player);
      }
    });
  }

  /** Called by FourLocoMoveAction after a successful delivery — resets pass tracking. */
  recordDelivery(): void {
    this.fourLocoPassState.update((state) => {
      state.passedPlayers = [];
    });
  }
}

// ---------------------------------------------------------------------------
// FourLocoMovePassAction
// Records the current player's pass in the phase state.
// ---------------------------------------------------------------------------

export class FourLocoMovePassAction extends MovePassAction {
  private readonly phase = inject(FourLocoMovePhase);
  private readonly currentPlayer = injectCurrentPlayer();

  process(_: EmptyAction): boolean {
    const result = super.process(_);
    this.phase.recordPass(this.currentPlayer().color);
    return result;
  }
}

// ---------------------------------------------------------------------------
// FourLocoMoveAction
// - Always awards exactly 2 income to the delivering player.
// - Resets pass tracking after each delivery.
// ---------------------------------------------------------------------------

export class FourLocoMoveAction extends MoveAction {
  private readonly phase = inject(FourLocoMovePhase);
  private readonly currentPlayerState = injectCurrentPlayer();

  calculateIncome(_action: MoveData): Map<PlayerColor, number> {
    // Always exactly 2 income credited to the current player only.
    return new Map([[this.currentPlayerState().color, 2]]);
  }

  process(action: MoveData): boolean {
    const result = super.process(action);
    this.phase.recordDelivery();
    return result;
  }
}

// ---------------------------------------------------------------------------
// FourLocoMoveValidator
// - Requires exactly 4 links per delivery.
// - Only allows using the current player's own track.
// ---------------------------------------------------------------------------

export class FourLocoMoveValidator extends MoveValidator {
  private readonly currentPlayer = injectCurrentPlayer();

  validatePartial(player: PlayerData, action: MoveData): void {
    // Run base validation first (locomotive check, duplicate stops, etc.)
    super.validatePartial(player, action);
    // Allow partial paths up to 4 links so MoveSearcher can find valid routes.
    // Exact length of 4 is enforced in validateEnd for complete deliveries.
    assert(action.path.length <= 4, {
      invalidInput: "4 Loco requires exactly 4 links per delivery",
    });
  }

  validateEnd(action: MoveData): void {
    assert(action.path.length === 4, {
      invalidInput: "4 Loco requires exactly 4 links per delivery",
    });
    super.validateEnd(action);
  }

  /**
   * Override to restrict route discovery to tracks where EVERY tile
   * belongs to the current player.  The base implementation only stores the
   * *first* tile's owner in RouteInfo.owner, so multi-tile routes that span
   * different players' tiles would be incorrectly allowed by a simple owner
   * filter on RouteInfo.  Using grid.getRoute() we inspect the full tile set.
   */
  findRoutesFromLocation(fromCoordinates: Coordinates): RouteInfo[] {
    const allRoutes = super.findRoutesFromLocation(fromCoordinates);
    const currentPlayerColor = this.currentPlayer().color;
    const grid = this.grid();
    return allRoutes.filter((route) => {
      if (route.type !== "track") return false;
      // Every physical tile in this route segment must be owned by the current player.
      return grid
        .getRoute(route.startingTrack)
        .every((tile) => tile.getOwner() === currentPlayerColor);
    });
  }
}
