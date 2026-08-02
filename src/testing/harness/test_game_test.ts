import { describe, expect, it } from "vitest";
import { BuildAction } from "../../engine/build/build";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { Direction, SimpleTileType } from "../../engine/state/tile";
import { PassAction } from "../../engine/turn_order/pass";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { TestGame, startGame } from "./test_game";

const { RED, BLUE, GREEN, PINK } = PlayerColor;

function newGame(seed = "harness"): TestGame {
  return startGame(RUST_BELT_GAME_KEY, {
    players: [RED, BLUE, GREEN],
    seed,
  });
}

/** Plays the opening phases up to the building phase. */
function toBuilding(game: TestGame): TestGame {
  const actions = [Action.FIRST_BUILD, Action.FIRST_MOVE, Action.PRODUCTION];
  let guard = 0;
  while (game.phase !== Phase.BUILDING && guard++ < 100) {
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
      default:
        throw new Error(`Unexpected phase ${game.phaseName}`);
    }
  }
  return game;
}

describe("startGame", () => {
  it("deals the requested colors to players in order", () => {
    const game = newGame();

    expect(
      game
        .snapshot()
        .players.map((p) => p.color)
        .sort(),
    ).toEqual(["blue", "green", "red"]);
    // playerId 2 was asked for BLUE, so its log lines should say blue.
    expect(game.logs.join("\n")).not.toContain("(brown)");
  });

  it("makes the playerId to color mapping deterministic", () => {
    const first = newGame("same");
    const second = newGame("same");

    expect(second.snapshot()).toEqual(first.snapshot());
  });

  it("defaults to the map's minimum player count", () => {
    const game = startGame(RUST_BELT_GAME_KEY, { seed: "defaults" });

    expect(game.snapshot().players).toHaveLength(3);
  });

  it("rejects dealing the same color twice", () => {
    expect(() =>
      startGame(RUST_BELT_GAME_KEY, { players: [RED, RED, BLUE] }),
    ).toThrow(/same color twice/);
  });

  it("starts in the shares phase of round 1", () => {
    const game = newGame();

    expect(game.phase).toBe(Phase.SHARES);
    expect(game.phaseName).toBe("Issue shares");
    expect(game.round).toBe(1);
    expect(game.hasEnded).toBe(false);
    expect(game.summary).toContain("Issue shares");
  });
});

describe("TestGame coordinates", () => {
  it("resolves the labels the UI displays", () => {
    const game = newGame();

    expect(game.label(game.coord("A2"))).toBe("A2");
    expect(game.space("A2")?.name).toBe("Duluth");
  });

  it("accepts labels case-insensitively and with surrounding space", () => {
    const game = newGame();

    expect(game.coord(" a2 ")).toBe(game.coord("A2"));
  });

  it("lists what is available when a label is wrong", () => {
    const game = newGame();

    expect(() => game.coord("C99")).toThrow(/Spaces in that row: C0, C2/);
    expect(() => game.coord("ZZ1")).toThrow(/No spaces found in that row/);
  });

  it("builds delivery paths from labels", () => {
    const game = newGame();

    expect(game.path("A2", "F1")).toEqual([
      { endingStop: game.coord("A2") },
      { endingStop: game.coord("F1") },
    ]);
  });
});

describe("TestGame actions", () => {
  it("emits through the action class and updates state", () => {
    const game = newGame();
    const player = game.currentPlayer;
    const before = game.player(player).money;

    const sharesBefore = game.player(player).shares;

    game.emit(TakeSharesAction, { numShares: 2 });

    expect(game.player(player).money).toBe(before + 10);
    // Players start holding 2 shares, so this is a delta rather than a total.
    expect(game.player(player).shares).toBe(sharesBefore + 2);
  });

  it("records logs per action and cumulatively", () => {
    const game = newGame();
    const logsAtStart = game.logs.length;

    game.emit(TakeSharesAction, { numShares: 1 });

    expect(game.lastLogs).toHaveLength(1);
    expect(game.lastLogs[0]).toContain("takes out 1 shares");
    expect(game.logs.length).toBe(logsAtStart + 1);
  });

  it("reports whether an action can be emitted right now", () => {
    const game = newGame();

    expect(game.canEmit(TakeSharesAction)).toBe(true);
    expect(game.canEmit(BuildAction)).toBe(false);
  });

  it("surfaces the validation message the UI would show", () => {
    const game = newGame();

    expect(game.errorFor(TakeSharesAction, { numShares: -1 })).toBe(
      "cannot take a negative number of shares",
    );
    expect(game.errorFor(TakeSharesAction, { numShares: 0 })).toBeUndefined();
  });

  it("does not change state when only checking for an error", () => {
    const game = newGame();
    const before = game.gameData;

    game.errorFor(TakeSharesAction, { numShares: 99 });

    expect(game.gameData).toBe(before);
  });

  it("asserts whose turn it is when using as()", () => {
    const game = newGame();
    const notTheirTurn = [RED, BLUE, GREEN].find(
      (color) => color !== game.currentPlayer,
    )!;

    expect(() =>
      game.as(notTheirTurn).emit(TakeSharesAction, { numShares: 0 }),
    ).toThrow(
      new RegExp(
        `Expected it to be ${playerColorToString(notTheirTurn)}'s turn`,
      ),
    );
  });

  it("names a player who is not in the game at all", () => {
    const game = newGame();

    expect(() =>
      game.as(PINK).emit(TakeSharesAction, { numShares: 0 }),
    ).toThrow(/Expected it to be pink's turn/);
  });

  it("round-trips action data through JSON the way the server receives it", () => {
    const game = toBuilding(newGame());
    const builder = game.currentPlayer;

    // Coordinates are class instances; they have to survive JSON to reach the
    // engine, exactly as they would over HTTP.
    const error = game.errorFor(BuildAction, {
      coordinates: game.coord("C6"),
      tileType: SimpleTileType.STRAIGHT,
      orientation: Direction.TOP,
    });

    // Whether or not this particular build is legal, the data must parse.
    expect(error === undefined || typeof error === "string").toBe(true);
    expect(game.currentPlayer).toBe(builder);
  });
});

describe("TestGame referee integration", () => {
  it("checks invariants after every action", () => {
    const game = toBuilding(newGame());

    // Reaching the building phase means shares, turn order and action selection
    // all passed the referee; a violation would have thrown at that action.
    expect(game.phase).toBe(Phase.BUILDING);
    expect(game.round).toBe(1);
    expect(
      game.snapshot().players.filter((p) => p.selectedAction != null),
    ).toHaveLength(3);
  });

  it("builds track and reflects the owner on the board", () => {
    const game = toBuilding(newGame());
    const builder = game.currentPlayer;

    // Ask the engine which build is legal rather than hard-coding one, so this
    // does not depend on the shape of any particular map.
    const orientations = [
      Direction.TOP,
      Direction.TOP_RIGHT,
      Direction.BOTTOM_RIGHT,
      Direction.BOTTOM,
      Direction.BOTTOM_LEFT,
      Direction.TOP_LEFT,
    ];
    const candidate = game.labels
      .flatMap((label) =>
        orientations.map((orientation) => ({ label, orientation })),
      )
      .find(({ label, orientation }) => {
        try {
          return (
            game.errorFor(BuildAction, {
              coordinates: game.coord(label),
              tileType: SimpleTileType.STRAIGHT,
              orientation,
            }) === undefined
          );
        } catch {
          // Unbuildable terrain asserts rather than returning a message.
          return false;
        }
      });

    expect(candidate).toBeDefined();

    game.as(builder).emit(BuildAction, {
      coordinates: game.coord(candidate!.label),
      tileType: SimpleTileType.STRAIGHT,
      orientation: candidate!.orientation,
    });

    expect(game.space(candidate!.label)?.track).toBeDefined();
    expect(game.space(candidate!.label)!.track!.join(" ")).toContain(
      playerColorToString(builder),
    );
    expect(game.player(builder).trackMarkers).toBeGreaterThan(0);
  });
});
