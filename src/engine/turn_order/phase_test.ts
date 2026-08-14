import { describe, expect, it } from "vitest";
import { TakeSharesAction } from "../shares/take_shares";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { TestGame, startGame } from "../../testing/harness/test_game";
import { BidAction } from "./bid";
import { PassAction } from "./pass";

const { RED, BLUE, GREEN, YELLOW } = PlayerColor;

/** Plays shares to reach the turn order (auction) phase of round 1. */
function toTurnOrder(seed: string): TestGame {
  const game = startGame(RUST_BELT_GAME_KEY, {
    players: [RED, BLUE, GREEN, YELLOW],
    seed,
  });
  let guard = 0;
  while (game.phase === Phase.SHARES && guard++ < 10) {
    game.emit(TakeSharesAction, { numShares: 0 });
  }
  return game;
}

describe("TurnOrderPhase", () => {
  it("forces a kicked bidder to pass and lets the auction continue to the expected turn order", () => {
    const game = toTurnOrder("turn-order-phase-kick");

    expect(game.phase).toBe(Phase.TURN_ORDER);
    const [firstPasser, kicked, bidderA, bidderB] = game.turnOrder;

    // One player passes outright.
    expect(game.currentPlayer).toBe(firstPasser);
    game.emit(PassAction, {});

    // The next player is kicked; they should be forced to pass rather than
    // stalling the auction, leaving the other two players to keep bidding.
    expect(game.currentPlayer).toBe(kicked);
    game.kick(kicked);

    expect(game.hasEnded).toBe(false);
    expect(game.phase).toBe(Phase.TURN_ORDER);
    expect(game.currentPlayer).toBe(bidderA);

    // The remaining two players bid twice more.
    game.emit(BidAction, { bid: 1 });
    expect(game.currentPlayer).toBe(bidderB);
    game.emit(BidAction, { bid: 2 });

    // bidderA concedes, leaving bidderB as the sole remaining bidder, which
    // resolves the auction automatically.
    expect(game.currentPlayer).toBe(bidderA);
    game.emit(PassAction, {});

    expect(game.hasEnded).toBe(false);
    expect(game.phase).toBe(Phase.ACTION_SELECTION);

    // The winner goes first, then players in reverse order of when they
    // passed; the kicked player is excluded entirely.
    expect(game.turnOrder).toEqual([bidderB, bidderA, firstPasser]);
    expect(game.player(kicked).outOfGame).toBe(true);

    // The winner and runner-up paid for their positions; the free passers did not.
    expect(game.player(bidderB).money).toBe(8);
    expect(game.player(bidderA).money).toBe(9);
    expect(game.player(firstPasser).money).toBe(10);
    expect(game.player(kicked).money).toBe(10);
  });
});
