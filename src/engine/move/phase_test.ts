import { describe, expect, it } from "vitest";
import { DoneAction } from "../build/done";
import { SelectAction } from "../select_action/select";
import { TakeSharesAction } from "../shares/take_shares";
import { Action } from "../state/action";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { PassAction } from "../turn_order/pass";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { TestGame, startGame } from "../../testing/harness/test_game";
import { MovePassAction } from "./pass";

const { RED, BLUE, GREEN } = PlayerColor;

/** Plays the opening phases up to move goods round 1. */
function toMoving(seed: string): TestGame {
  const game = startGame(RUST_BELT_GAME_KEY, {
    players: [RED, BLUE, GREEN],
    seed,
  });
  const actions = [Action.FIRST_BUILD, Action.FIRST_MOVE, Action.PRODUCTION];
  let guard = 0;
  while (game.phase !== Phase.MOVING && guard++ < 100) {
    switch (game.phase) {
      case Phase.SHARES:
        game.emit(TakeSharesAction, { numShares: 0 });
        break;
      case Phase.TURN_ORDER:
        game.emit(PassAction, {});
        break;
      case Phase.ACTION_SELECTION:
        game.emit(SelectAction, { action: actions.shift()! });
        break;
      case Phase.BUILDING:
        game.emit(DoneAction, {});
        break;
      default:
        throw new Error(`Unexpected phase ${game.phaseName}`);
    }
  }
  return game;
}

describe("MovePhase", () => {
  it("advances to move goods round 2 rather than skipping it, when the last player in round 1's turn order is kicked", () => {
    const game = toMoving("move-phase-kick");

    expect(game.phase).toBe(Phase.MOVING);
    expect(game.summary).toContain("Move goods round 1");

    // Pass the first two players in round 1's turn order, leaving the last player active.
    game.emit(MovePassAction, {});
    game.emit(MovePassAction, {});
    const lastPlayerInRound = game.currentPlayer;

    game.kick(lastPlayerInRound);

    // Round 1 only had 3 turns; kicking the 3rd should start round 2, not end the phase.
    expect(game.hasEnded).toBe(false);
    expect(game.phase).toBe(Phase.MOVING);
    expect(game.summary).toContain("Move goods round 2");

    // Round 2 should be playable normally by the two remaining players. The
    // automatic phases after it (income, expenses, etc.) then run without
    // further input, landing back on shares for the next game round.
    game.emit(MovePassAction, {});
    game.emit(MovePassAction, {});

    expect(game.hasEnded).toBe(false);
    expect(game.phase).toBe(Phase.SHARES);
    expect(game.round).toBe(2);
  });
});
