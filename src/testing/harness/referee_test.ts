import { describe, expect, it } from "vitest";
import { EngineDelegator } from "../../engine/framework/engine";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { Referee, checkSnapshot } from "./referee";
import { GameSnapshot, snapshotGame } from "./snapshot";

function startedSnapshot(seed = "referee"): GameSnapshot {
  const state = EngineDelegator.singleton.start({
    game: { id: 1, gameKey: RUST_BELT_GAME_KEY, variant: {} },
    players: [1, 2, 3].map((playerId) => ({ playerId })),
    seed,
  });
  return snapshotGame({
    gameKey: RUST_BELT_GAME_KEY,
    gameData: state.gameData,
  });
}

/** Deep-copies a snapshot so a test can corrupt it without affecting others. */
function corrupt(
  snapshot: GameSnapshot,
  mutate: (s: GameSnapshot) => void,
): GameSnapshot {
  const copy = JSON.parse(JSON.stringify(snapshot)) as GameSnapshot;
  mutate(copy);
  return copy;
}

function invariantsFor(snapshot: GameSnapshot): string[] {
  return checkSnapshot(snapshot).map((v) => v.invariant);
}

describe("checkSnapshot", () => {
  it("passes on a freshly started game", () => {
    expect(checkSnapshot(startedSnapshot())).toEqual([]);
  });

  it("catches negative money for an in-game player", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.players[0].money = -1;
    });

    expect(invariantsFor(snapshot)).toContain(
      "in-game players never hold negative money",
    );
  });

  it("allows an out-of-game player to sit at money 0 with negative income", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.players[0].outOfGame = true;
      s.players[0].income = -1;
      s.players[0].money = 0;
    });

    expect(checkSnapshot(snapshot)).toEqual([]);
  });

  it("allows negative income for a live player, which Denmark relies on", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.players[0].income = -4;
    });

    expect(checkSnapshot(snapshot)).toEqual([]);
  });

  it("catches non-finite numbers", () => {
    const snapshot = startedSnapshot();
    // NaN cannot survive a JSON round trip, so corrupt in place on a fresh read.
    snapshot.players[0].money = NaN;

    expect(invariantsFor(snapshot)).toContain("player numbers are finite");
  });

  it("catches a current player who is not in the game", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.currentPlayer = "brown";
    });

    expect(invariantsFor(snapshot)).toContain("current player is in the game");
  });

  it("catches duplicated turn order entries", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.turnOrder = [s.turnOrder[0], s.turnOrder[0], s.turnOrder[1]];
    });

    expect(invariantsFor(snapshot)).toContain("turn order has no duplicates");
  });

  it("catches track owned by a player who is not in the game", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.spaces[0].track = ["brown:N-S"];
    });

    expect(invariantsFor(snapshot)).toContain(
      "track is only owned by players in the game",
    );
  });

  it("accepts unowned and claimable track", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.spaces[0].track = ["unowned:N-S", "claimable:NE-SW"];
    });

    expect(checkSnapshot(snapshot)).toEqual([]);
  });

  it("catches duplicate space labels", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.spaces[1].label = s.spaces[0].label;
    });

    expect(invariantsFor(snapshot)).toContain("space labels are unique");
  });

  it("catches a negative bag count", () => {
    const snapshot = corrupt(startedSnapshot(), (s) => {
      s.bag["Red"] = -3;
    });

    expect(invariantsFor(snapshot)).toContain(
      "bag counts are non-negative integers",
    );
  });
});

describe("Referee", () => {
  it("accepts a healthy sequence of states", () => {
    const referee = new Referee(startedSnapshot("seq"));

    expect(() =>
      referee.check(startedSnapshot("seq"), "no-op step"),
    ).not.toThrow();
  });

  it("rejects a state whose player set shrank", () => {
    const referee = new Referee(startedSnapshot("shrink"));
    const snapshot = corrupt(startedSnapshot("shrink"), (s) => {
      s.players.pop();
    });

    expect(() => referee.check(snapshot, "a bad action")).toThrow(
      /the set of players never changes size/,
    );
  });

  it("rejects a state whose player colors changed", () => {
    const referee = new Referee(startedSnapshot("recolor"));
    const snapshot = corrupt(startedSnapshot("recolor"), (s) => {
      s.players[0].color = "brown";
    });

    expect(() => referee.check(snapshot, "a bad action")).toThrow(
      /player colors never change/,
    );
  });

  it("rejects a round counter going backwards", () => {
    const initial = startedSnapshot("rounds");
    initial.round = 4;
    const referee = new Referee(initial);

    const snapshot = corrupt(initial, (s) => {
      s.round = 3;
    });

    expect(() => referee.check(snapshot, "a bad action")).toThrow(
      /never goes backwards/,
    );
  });

  it("names the failing step in the error message", () => {
    const referee = new Referee(startedSnapshot("context"));
    const snapshot = corrupt(startedSnapshot("context"), (s) => {
      s.players[0].money = -5;
    });

    expect(() => referee.check(snapshot, "build at B5")).toThrow(
      /after build at B5/,
    );
  });

  it("validates the initial state at construction", () => {
    const broken = corrupt(startedSnapshot("broken-start"), (s) => {
      s.players[0].shares = -1;
    });

    expect(() => new Referee(broken)).toThrow(/shares are never negative/);
  });
});
