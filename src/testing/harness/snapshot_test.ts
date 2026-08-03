import { describe, expect, it } from "vitest";
import { EngineDelegator } from "../../engine/framework/engine";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { formatSnapshot } from "./format";
import { playerIn, snapshotGame, spaceIn } from "./snapshot";

const PLAYERS = [1, 2, 3].map((playerId) => ({ playerId }));

function startedGame(seed: string) {
  const state = EngineDelegator.singleton.start({
    game: { id: 1, gameKey: RUST_BELT_GAME_KEY, variant: {} },
    players: PLAYERS,
    seed,
  });
  return { gameKey: RUST_BELT_GAME_KEY, gameData: state.gameData };
}

describe("snapshotGame", () => {
  it("projects the top-level state of a started game", () => {
    const snapshot = snapshotGame(startedGame("snapshot-1"));

    expect(snapshot.round).toBe(1);
    expect(snapshot.phase).toBe("SHARES");
    expect(snapshot.players).toHaveLength(3);
    expect(snapshot.turnOrder).toHaveLength(3);
    expect(snapshot.currentPlayer).toBe(snapshot.turnOrder[0]);
  });

  it("is deterministic for the same seed", () => {
    const first = snapshotGame(startedGame("same-seed"));
    const second = snapshotGame(startedGame("same-seed"));

    expect(second).toEqual(first);
  });

  it("does not mutate the game state it reads", () => {
    const game = startedGame("no-mutation");
    const before = game.gameData;

    snapshotGame(game);
    snapshotGame(game);

    expect(game.gameData).toBe(before);
    expect(snapshotGame(game)).toEqual(snapshotGame(game));
  });

  it("orders players by color rather than by internal array order", () => {
    const snapshot = snapshotGame(startedGame("ordering"));
    const colors = snapshot.players.map((p) => p.color);

    expect(colors).toEqual([...colors].sort());
  });

  it("orders spaces by row then numerically by column", () => {
    const snapshot = snapshotGame(startedGame("ordering"));
    const labels = snapshot.spaces.map((s) => s.label);

    // Naive string sorting would put "C16" before "C4"; the projection must not.
    const rowC = labels
      .filter((l) => l.startsWith("C"))
      .map((l) => Number(l.slice(1)));
    expect(rowC).toEqual([...rowC].sort((a, b) => a - b));
  });

  it("reports named cities with their goods and goods-growth slots", () => {
    const snapshot = snapshotGame(startedGame("cities"));
    const duluth = snapshot.spaces.find((s) => s.name === "Duluth");

    expect(duluth).toBeDefined();
    expect(duluth!.kind).toBe("city");
    expect(duluth!.urbanized).toBe(false);
    expect(duluth!.goods!.length).toBeGreaterThan(0);
    expect(duluth!.onRoll!.length).toBeGreaterThan(0);
  });

  it("omits empty land but keeps towns", () => {
    const snapshot = snapshotGame(startedGame("terrain"));

    expect(snapshot.spaces.every((s) => s.kind !== "land")).toBe(true);
    expect(snapshot.spaces.some((s) => s.kind === "town")).toBe(true);
  });

  it("starts every player with no track markers", () => {
    const snapshot = snapshotGame(startedGame("track"));

    for (const player of snapshot.players) {
      expect(player.trackMarkers).toBe(0);
    }
  });

  it("exposes lookup helpers that fail loudly on a bad color", () => {
    const snapshot = snapshotGame(startedGame("lookup"));
    const firstColor = snapshot.players[0].color;

    expect(spaceIn(snapshot, "nowhere-at-all")).toBeUndefined();
    expect(snapshot.players.map((p) => p.color)).toContain(firstColor);
    // PlayerColor.WHITE is never dealt in a 3 player game.
    expect(() => playerIn(snapshot, 8)).toThrow(/no white player/);
  });
});

describe("snapshotGame scoring", () => {
  it("renders an eliminated player without crashing", () => {
    // getScore returns `number[] | "Eliminated"`. The eliminated case is a
    // string, so a `typeof === "object"` test falls through to .join() and
    // throws -- which took out the first bot run that bankrupted anybody.
    const game = startedGame("eliminated");
    const state = JSON.parse(game.gameData);
    state.gameData.players[0].outOfGame = true;
    const withElimination = {
      gameKey: RUST_BELT_GAME_KEY,
      gameData: JSON.stringify(state),
    };

    expect(() => snapshotGame(withElimination)).not.toThrow();
    const snapshot = snapshotGame(withElimination);
    const eliminated = snapshot.players.find((player) => player.outOfGame);
    expect(eliminated).toBeDefined();
    expect(eliminated!.score).toBe("Eliminated");
  });
});

describe("formatSnapshot", () => {
  it("renders stable, readable text", () => {
    const snapshot = snapshotGame(startedGame("format"));
    const text = formatSnapshot(snapshot);

    expect(text).toContain("round=1 phase=SHARES");
    expect(text).toContain("players:");
    expect(text).toContain("board:");
    expect(text).toContain("bag:");
    expect(text).toMatch(/\$10\s+income=0\s+shares=2/);
  });

  it("produces identical text for identical states", () => {
    expect(formatSnapshot(snapshotGame(startedGame("stable")))).toBe(
      formatSnapshot(snapshotGame(startedGame("stable"))),
    );
  });
});
