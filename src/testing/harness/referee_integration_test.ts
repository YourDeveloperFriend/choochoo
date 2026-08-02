import { describe, expect, it } from "vitest";
import { EngineDelegator, GameState } from "../../engine/framework/engine";
import { LimitedGame } from "../../engine/game/game_memory";
import { Action } from "../../engine/state/action";
import { RUST_BELT_GAME_KEY } from "../../maps/rust_belt/settings";
import { REVERSTEAM_GAME_KEY } from "../../maps/reversteam/settings";
import { Referee } from "./referee";
import { snapshotGame } from "./snapshot";

/**
 * Drives a real game forward with the referee checking after every action.
 *
 * A referee that fires on legitimate play is worse than no referee, so this
 * exercises actual engine transitions rather than hand-corrupted snapshots.
 */
function playAndPolice(gameKey: string, seed: string, maxActions: number) {
  const newGame = (gameData?: string): LimitedGame => ({
    id: 1,
    gameKey,
    gameData,
    variant: {},
  });

  let state: GameState = EngineDelegator.singleton.start({
    game: newGame(),
    players: [1, 2, 3].map((playerId) => ({ playerId })),
    seed,
  });

  const referee = new Referee(
    snapshotGame({ gameKey, gameData: state.gameData }),
  );

  const actionsToAssign = [
    Action.FIRST_BUILD,
    Action.FIRST_MOVE,
    Action.PRODUCTION,
    Action.LOCOMOTIVE,
    Action.ENGINEER,
    Action.URBANIZATION,
  ];

  function summary(): string {
    return EngineDelegator.singleton.readSummary(newGame(state.gameData));
  }

  let steps = 0;
  for (; steps < maxActions; steps++) {
    const phase = summary();
    let actionName: string;
    let actionData: object;

    if (phase.includes("Issue shares")) {
      actionName = "takeShares";
      actionData = { numShares: 0 };
    } else if (phase.includes("Bid for turn order")) {
      actionName = "pass";
      actionData = {};
    } else if (phase.includes("Select actions")) {
      actionName = "select";
      actionData = { action: actionsToAssign.shift() ?? Action.URBANIZATION };
    } else {
      // Reached a phase this driver doesn't know how to answer (building,
      // moving, ...). That is far enough for an invariant check.
      break;
    }

    state = EngineDelegator.singleton.processAction(gameKey, {
      game: newGame(state.gameData),
      actionName,
      actionData,
      seed: state.seed ?? undefined,
    });

    referee.check(
      snapshotGame({ gameKey, gameData: state.gameData }),
      `${actionName} (step ${steps + 1})`,
    );
  }

  return { steps, finalPhase: summary(), state };
}

describe("Referee against real play", () => {
  it("finds no violations driving Rust Belt into the building phase", () => {
    const { steps, finalPhase } = playAndPolice(
      RUST_BELT_GAME_KEY,
      "police-rust-belt",
      40,
    );

    expect(steps).toBeGreaterThan(5);
    expect(finalPhase).toContain("Build track");
  });

  it("finds no violations driving Reversteam into the building phase", () => {
    const { steps, finalPhase } = playAndPolice(
      REVERSTEAM_GAME_KEY,
      "police-reversteam",
      40,
    );

    expect(steps).toBeGreaterThan(5);
    expect(finalPhase).toContain("Build track");
  });

  it("keeps the projection consistent with the engine's own summary", () => {
    const { state } = playAndPolice(RUST_BELT_GAME_KEY, "consistency", 40);
    const snapshot = snapshotGame({
      gameKey: RUST_BELT_GAME_KEY,
      gameData: state.gameData,
    });

    expect(snapshot.phase).toBe("BUILDING");
    expect(snapshot.round).toBe(1);
    // Every player picked an action during action selection.
    expect(
      snapshot.players.filter((p) => p.selectedAction != null),
    ).toHaveLength(3);
  });
});
