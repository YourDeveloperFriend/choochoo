import { EngineDelegator } from "../../engine/framework/engine";
import { LimitedGame } from "../../engine/game/game_memory";
import { PlayerUser } from "../../engine/game/starter";
import { Action } from "../../engine/state/action";

// Drives a real Stalinist Russia game from the start through the issue shares,
// turn order, action selection and (new) locomotive phases, exercising the
// custom machinery end-to-end.
describe("Stalinist Russia", () => {
  const GAME_KEY = "stalinist-russia";

  function newGame(gameData?: string): LimitedGame {
    return { id: 1, gameKey: GAME_KEY, gameData, variant: {} };
  }

  it("runs through the locomotive phase and assigns Stalin's disfavor", () => {
    const players: PlayerUser[] = [1, 2, 3, 4].map((playerId) => ({
      playerId,
    }));

    let state = EngineDelegator.singleton.start({
      game: newGame(),
      players,
      seed: "smoke-seed",
    });

    const allLogs: string[] = [...state.logs];
    const actionsToAssign = [
      Action.LOCOMOTIVE,
      Action.FIRST_MOVE,
      Action.FIRST_BUILD,
      Action.PRODUCTION,
    ];
    let advancedOnLoco = false;

    function summary(): string {
      return EngineDelegator.singleton.readSummary(newGame(state.gameData));
    }

    function emit(actionName: string, actionData: object): void {
      state = EngineDelegator.singleton.processAction(GAME_KEY, {
        game: newGame(state.gameData),
        actionName,
        actionData,
        seed: state.seed ?? undefined,
      });
      allLogs.push(...state.logs);
    }

    // Walk the game forward until we have entered (and passed through) the
    // locomotive phase into building.
    let guard = 0;
    while (!summary().includes("Build track") && guard++ < 100) {
      const phase = summary();
      if (phase.includes("Issue shares")) {
        emit("takeShares", { numShares: 0 });
      } else if (phase.includes("Bid for turn order")) {
        emit("pass", {});
      } else if (phase.includes("Select actions")) {
        const action = actionsToAssign.shift() ?? Action.URBANIZATION;
        emit("select", { action });
      } else if (phase.includes("Locomotive")) {
        if (!advancedOnLoco) {
          advancedOnLoco = true;
          // Round 1 caps advancement at box 1.
          emit("locoAdvance", { targetBox: 1, row: "many" });
        }
        emit("locoSkip", {});
      } else {
        throw new Error(`Unexpected phase: ${phase}`);
      }
    }

    expect(summary()).toContain("Build track");
    expect(allLogs.some((log) => log.includes("Stalin's disfavor track"))).toBe(
      true,
    );
    expect(allLogs.some((log) => log.includes("on the locomotive track"))).toBe(
      true,
    );
  });
});
