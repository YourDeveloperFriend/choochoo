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
import { MoveValidator } from "../../engine/move/validator";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { assert } from "../../utils/validate";

// ---------------------------------------------------------------------------
// State: track which players have passed in this delivery phase.
// When a player makes a delivery, the list resets — everyone must pass again
// (but note: once a player passes, they are done until the next reset).
// The phase ends only when ALL players appear in this list consecutively.
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
// pass (once you pass, you are done unless the state is reset by a delivery).
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
   * After each turn, find the next player who has NOT yet passed.
   * If all players have passed, the phase ends.
   * When a delivery is made, passedPlayers resets, so everyone is eligible
   * again.
   */
  findNextPlayer(currPlayer: PlayerColor): PlayerColor | undefined {
    const playerOrder = this.getPlayerOrder();
    const passed = this.fourLocoPassState().passedPlayers;

    // If every player has passed consecutively, end the phase.
    if (playerOrder.every((p) => passed.includes(p))) {
      return undefined;
    }

    // Find the next player in order after currPlayer who hasn't passed.
    const currIndex = playerOrder.indexOf(currPlayer);
    for (let i = 1; i <= playerOrder.length; i++) {
      const candidate = playerOrder[(currIndex + i) % playerOrder.length];
      if (!passed.includes(candidate)) {
        return candidate;
      }
    }

    return undefined;
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
}

// ---------------------------------------------------------------------------
// FourLocoMovePassAction
// Records the current player's pass in the shared state.
// ---------------------------------------------------------------------------

export class FourLocoMovePassAction extends MovePassAction {
  private readonly fourLocoPassState = injectState(FOUR_LOCO_PASS_STATE);
  private readonly currentPlayer = injectCurrentPlayer();

  process(_: EmptyAction): boolean {
    const result = super.process(_);
    const color = this.currentPlayer().color;
    this.fourLocoPassState.update((state) => {
      if (!state.passedPlayers.includes(color)) {
        state.passedPlayers.push(color);
      }
    });
    return result;
  }
}

// ---------------------------------------------------------------------------
// FourLocoMoveAction
// - Always awards exactly 2 income to the delivering player.
// - Resets pass tracking after each delivery so everyone can deliver again.
// ---------------------------------------------------------------------------

export class FourLocoMoveAction extends MoveAction {
  private readonly fourLocoPassState = injectState(FOUR_LOCO_PASS_STATE);
  private readonly currentPlayerState = injectCurrentPlayer();

  calculateIncome(_action: MoveData): Map<PlayerColor, number> {
    // Always exactly 2 income credited to the current player only.
    return new Map([[this.currentPlayerState().color, 2]]);
  }

  process(action: MoveData): boolean {
    const result = super.process(action);
    // Reset pass tracking: a delivery was made, so everyone is eligible again.
    this.fourLocoPassState.update((state) => {
      state.passedPlayers = [];
    });
    return result;
  }
}

// ---------------------------------------------------------------------------
// FourLocoMoveValidator
// - Requires exactly 4 links per delivery.
// - Only allows using the current player's own track (checked via step.owner).
// ---------------------------------------------------------------------------

export class FourLocoMoveValidator extends MoveValidator {
  private readonly currentPlayer = injectCurrentPlayer();

  validatePartial(player: PlayerData, action: MoveData): void {
    // Run base validation first (locomotive check, duplicate stops, etc.)
    super.validatePartial(player, action);
    // Allow partial paths up to 4 links so MoveSearcher can find valid routes.
    assert(action.path.length <= 4, {
      invalidInput: "4 Loco requires exactly 4 links per delivery",
    });
  }

  validateEnd(action: MoveData): void {
    assert(action.path.length === 4, {
      invalidInput: "4 Loco requires exactly 4 links per delivery",
    });
    // Every step must be owned by the current player.
    const currentPlayerColor = this.currentPlayer().color;
    for (const step of action.path) {
      assert(step.owner === currentPlayerColor, {
        invalidInput: "4 Loco requires using only your own track",
      });
    }
    super.validateEnd(action);
  }
}
