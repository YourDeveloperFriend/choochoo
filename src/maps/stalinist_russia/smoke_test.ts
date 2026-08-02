import { describe, expect, it } from "vitest";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { PassAction } from "../../engine/turn_order/pass";
import { TestGame, startGame } from "../../testing/harness/test_game";
import { LocoAdvanceAction, LocoSkipAction } from "./locomotive_phase";
import { LocoRow } from "./track_data";

// Drives a real Stalinist Russia game from the start through the issue shares,
// turn order, action selection and locomotive phases, exercising the custom
// machinery end to end. The referee checks engine invariants after every action.
describe("Stalinist Russia", () => {
  const GAME_KEY = "stalinist-russia";
  const { RED, BLUE, YELLOW, GREEN } = PlayerColor;

  function newGame(): TestGame {
    return startGame(GAME_KEY, {
      players: [RED, BLUE, YELLOW, GREEN],
      seed: "smoke-seed",
    });
  }

  interface AdvanceOptions {
    /** Have the first player to reach the locomotive phase pay to advance. */
    advanceLocoOnce?: boolean;
  }

  /**
   * Plays the opening phases until `target` is reached, answering each with the
   * simplest legal choice. Every player selects a different action, since an
   * action can only be taken once per round.
   *
   * Switching on the phase enum rather than substrings of the display summary
   * means rewording a summary cannot silently change which branch runs. This is
   * the boilerplate a general autopilot will eventually absorb.
   */
  function advanceTo(
    game: TestGame,
    target: Phase,
    options: AdvanceOptions = {},
  ): TestGame {
    const remainingActions = [
      Action.LOCOMOTIVE,
      Action.FIRST_MOVE,
      Action.FIRST_BUILD,
      Action.PRODUCTION,
      Action.URBANIZATION,
      Action.ENGINEER,
    ];
    let advancedOnLoco = false;
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
          game.emit(PassAction, {});
          break;
        case Phase.ACTION_SELECTION:
          game.emit(SelectAction, { action: remainingActions.shift()! });
          break;
        case Phase.STALINIST_LOCOMOTIVE:
          if (options.advanceLocoOnce && !advancedOnLoco) {
            advancedOnLoco = true;
            // Round 1 caps advancement at box 1.
            game.emit(LocoAdvanceAction, { targetBox: 1, row: LocoRow.MANY });
          } else {
            game.emit(LocoSkipAction, {});
          }
          break;
        default:
          throw new Error(`Unexpected phase: ${game.phaseName}`);
      }
    }
    return game;
  }

  it("runs through the locomotive phase and assigns Stalin's disfavor", () => {
    const game = advanceTo(newGame(), Phase.BUILDING, {
      advanceLocoOnce: true,
    });

    expect(game.round).toBe(1);
    expect(
      game.logs.some((log) => log.includes("Stalin's disfavor track")),
    ).toBe(true);
    expect(
      game.logs.some((log) => log.includes("on the locomotive track")),
    ).toBe(true);
  });

  it("charges the advancing player for moving up the locomotive track", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    const advancing = game.currentPlayer;
    const before = game.player(advancing).money;

    game
      .as(advancing)
      .emit(LocoAdvanceAction, { targetBox: 1, row: LocoRow.MANY });

    expect(game.player(advancing).money).toBeLessThan(before);
    expect(
      game.lastLogs.some((log) => log.includes("on the locomotive track")),
    ).toBe(true);
  });

  it("rejects advancing past the box the current round allows", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    // Round 1 allows box 1 only, so box 3 is the error the UI would surface.
    expect(
      game.errorFor(LocoAdvanceAction, { targetBox: 3, row: LocoRow.MANY }),
    ).toBeDefined();
    expect(
      game.errorFor(LocoAdvanceAction, { targetBox: 1, row: LocoRow.MANY }),
    ).toBeUndefined();
  });

  it("lets a player skip the locomotive phase without paying", () => {
    const game = advanceTo(newGame(), Phase.STALINIST_LOCOMOTIVE);

    const skipping = game.currentPlayer;
    const before = game.player(skipping).money;

    game.as(skipping).emit(LocoSkipAction, {});

    expect(game.player(skipping).money).toBe(before);
  });
});
