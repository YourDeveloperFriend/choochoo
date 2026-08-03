import { ExportableGame, ExportableHistory, toGameExport } from "./export";

/**
 * The export exists so a finished game can become a replayable regression test,
 * so the shape it produces has to line up with how a game is actually recorded:
 * starting a game writes a history row carrying the seed but no action, and each
 * later row carries an action plus the state it was applied to.
 */
describe("toGameExport", () => {
  const game: ExportableGame = {
    id: 7,
    gameKey: "rust-belt",
    variant: { baseRules: true },
    playerIds: [10, 20, 30],
  };

  function history(
    overrides: Partial<ExportableHistory> & { previousGameVersion: number },
  ): ExportableHistory {
    return {
      previousGameData: null,
      actionName: null,
      actionData: null,
      seed: null,
      ...overrides,
    };
  }

  const startRow = history({ previousGameVersion: 1, seed: "start-seed" });
  const firstAction = history({
    previousGameVersion: 2,
    actionName: "takeShares",
    actionData: '{"numShares":2}',
    seed: "seed-a",
    previousGameData: '{"version":3,"gameData":{}}',
  });
  const secondAction = history({
    previousGameVersion: 3,
    actionName: "pass",
    actionData: "{}",
    seed: null,
  });

  it("carries the game's identity and setup", () => {
    const exported = toGameExport(game, [startRow, firstAction]);

    expect(exported.id).toEqual(7);
    expect(exported.gameKey).toEqual("rust-belt");
    expect(exported.variant).toEqual({ baseRules: true });
    expect(exported.playerIds).toEqual([10, 20, 30]);
  });

  it("takes the start seed from the row that has no action", () => {
    const exported = toGameExport(game, [startRow, firstAction, secondAction]);

    expect(exported.startSeed).toEqual("start-seed");
  });

  it("excludes the start row from the actions", () => {
    const exported = toGameExport(game, [startRow, firstAction, secondAction]);

    expect(exported.actions.map((action) => action.actionName)).toEqual([
      "takeShares",
      "pass",
    ]);
  });

  it("parses action data back into a value", () => {
    const exported = toGameExport(game, [startRow, firstAction]);

    expect(exported.actions[0].actionData).toEqual({ numShares: 2 });
  });

  it("keeps each action's own seed, including when it needed none", () => {
    const exported = toGameExport(game, [startRow, firstAction, secondAction]);

    // The engine generates a seed lazily, the first time an action draws, so an
    // action that needed no randomness records none. Replay has to preserve
    // that rather than substitute the game's start seed.
    expect(exported.actions[0].seed).toEqual("seed-a");
    expect(exported.actions[1].seed).toBeNull();
  });

  it("reports the state the first action was applied to as the start state", () => {
    const exported = toGameExport(game, [startRow, firstAction, secondAction]);

    // That is the state immediately after setup, which is what a replay from
    // the seed should reproduce.
    expect(exported.startState).toEqual('{"version":3,"gameData":{}}');
  });

  it("orders actions by version whatever order the rows arrive in", () => {
    const exported = toGameExport(game, [secondAction, firstAction, startRow]);

    expect(exported.actions.map((action) => action.version)).toEqual([2, 3]);
  });

  it("handles a game that was started but never played", () => {
    const exported = toGameExport(game, [startRow]);

    expect(exported.actions).toEqual([]);
    expect(exported.startSeed).toEqual("start-seed");
    expect(exported.startState).toBeNull();
  });

  it("handles a game with no history at all", () => {
    const exported = toGameExport(game, []);

    expect(exported.actions).toEqual([]);
    expect(exported.startSeed).toBeNull();
    expect(exported.startState).toBeNull();
  });

  it("tolerates an action row that recorded no data", () => {
    const noData = history({
      previousGameVersion: 2,
      actionName: "pass",
      actionData: null,
    });
    const exported = toGameExport(game, [startRow, noData]);

    expect(exported.actions[0].actionName).toEqual("pass");
    expect(exported.actions[0].actionData).toBeUndefined();
  });
});
