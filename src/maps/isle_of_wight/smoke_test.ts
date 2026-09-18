import { describe, expect, it } from "vitest";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { BidAction } from "../../engine/turn_order/bid";
import { PassAction } from "../../engine/turn_order/pass";
import { startGame, TestGame } from "../../testing/harness/test_game";
import { DoneAction } from "../../engine/build/done";
import { MovePassAction } from "../../engine/move/pass";
import { BuyTrainsAction, BuyTrainsPassAction } from "./buy_trains";
import { ScrapPassAction } from "./scrap";

// Drives a real Isle of Wight game through the opening phases, exercising the
// Buy Trains step, the reversed player order, the share and expense changes and
// the Scrap step. The referee checks engine invariants after every action.
describe("Isle of Wight", () => {
  const GAME_KEY = "isle-of-wight";
  const { RED, BLUE, YELLOW } = PlayerColor;

  function newGame(): TestGame {
    return startGame(GAME_KEY, {
      players: [RED, BLUE, YELLOW],
      seed: "smoke-seed",
    });
  }

  interface AdvanceOptions {
    /** Whether each player buys a train when the Buy Trains step comes round. */
    buyTrains?: boolean;
  }

  /**
   * Plays from the start until `target` is reached, answering each phase with the
   * simplest legal choice. One player bids so that they still get a role: at
   * three players this map uses the Montréal rule, under which players who pass
   * without bidding select no action.
   */
  function advanceTo(
    game: TestGame,
    target: Phase,
    options: AdvanceOptions = {},
  ): TestGame {
    const remainingActions = [
      Action.FIRST_BUILD,
      Action.FIRST_MOVE,
      Action.URBANIZATION,
    ];
    let hasBid = false;
    let guard = 0;
    while (game.phase !== target) {
      if (guard++ > 100) {
        throw new Error(
          `Never reached ${Phase[target]}; stuck at ${game.phaseName}.`,
        );
      }
      switch (game.phase) {
        case Phase.SHARES:
          game.emit(TakeSharesAction, { numShares: 0 });
          break;
        case Phase.TURN_ORDER:
          if (!hasBid) {
            hasBid = true;
            game.emit(BidAction, { bid: 1 });
          } else {
            game.emit(PassAction, {});
          }
          break;
        case Phase.ACTION_SELECTION:
          game.emit(SelectAction, { action: remainingActions.shift()! });
          break;
        case Phase.STALINIST_LOCOMOTIVE:
          if (options.buyTrains) {
            game.emit(BuyTrainsAction, { trains: [{ coupons: 0 }] });
          } else {
            game.emit(BuyTrainsPassAction, {});
          }
          break;
        case Phase.BUILDING:
          // The grid is empty, so there is nothing to build or ship.
          game.emit(DoneAction, {});
          break;
        case Phase.MOVING:
          game.emit(MovePassAction, {});
          break;
        case Phase.SCRAP:
          game.emit(ScrapPassAction, {});
          break;
        default:
          throw new Error(`Unexpected phase: ${game.phaseName}`);
      }
    }
    return game;
  }

  it("runs a Buy Trains step between action selection and building", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    expect(game.round).toBe(1);
    expect(game.summary).toContain("Buy trains");
  });

  it("buys trains in reverse turn order", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    const turnOrder = game.turnOrder;
    expect(game.currentPlayer).toBe(turnOrder[turnOrder.length - 1]);
  });

  it("sells starter trains from the lowest available layer", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    const buyer = game.currentPlayer;
    const before = game.player(buyer).money;

    game.as(buyer).emit(BuyTrainsAction, { trains: [{ coupons: 0 }] });

    expect(game.player(buyer).money).toBe(before - 2);
    expect(game.lastLogs.some((log) => log.includes("buys a 1-train"))).toBe(
      true,
    );
  });

  it("rejects holding more than two trains", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    expect(
      game.errorFor(BuyTrainsAction, {
        trains: [{ coupons: 0 }, { coupons: 0 }],
      }),
    ).toBeUndefined();
    expect(
      game.errorFor(BuyTrainsAction, {
        trains: [{ coupons: 0 }, { coupons: 0 }, { coupons: 0 }],
      }),
    ).toBeDefined();
  });

  it("rejects spending Haggle coupons the player does not hold", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    expect(
      game.errorFor(BuyTrainsAction, { trains: [{ coupons: 1 }] }),
    ).toBeDefined();
  });

  it("charges expenses for shares only, not for trains", () => {
    const game = advanceTo(newGame(), Phase.SCRAP, { buyTrains: true });

    // Two shares and no income, so $2. The base game would also charge $1 for
    // the locomotive every player starts with.
    const expenseLogs = game.logs.filter((log) => log.includes("for expenses"));
    expect(expenseLogs).toHaveLength(3);
    for (const log of expenseLogs) {
      expect(log).toContain("pays $2 for expenses");
    }
  });

  it("lets players issue up to 25 shares", () => {
    const game = newGame();

    expect(game.errorFor(TakeSharesAction, { numShares: 23 })).toBeUndefined();
    expect(game.errorFor(TakeSharesAction, { numShares: 24 })).toBeDefined();
  });

  it("ends the turn with a Scrap step and no Goods Growth", () => {
    const game = advanceTo(newGame(), Phase.SCRAP, { buyTrains: true });

    expect(game.summary).toContain("Scrap");
    expect(game.logs.some((log) => log.includes("Goods growth"))).toBe(false);
  });
});
