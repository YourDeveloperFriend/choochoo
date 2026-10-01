import { describe, expect, it } from "vitest";
import { PlayerColor } from "../../engine/state/player";
import { startGame } from "../../testing/harness/test_game";
import { DetroitBankruptcyMapSettings } from "./settings";

const { RED, BLUE } = PlayerColor;

describe("Detroit Bankruptcy", () => {
  it("scores a kicked player by the round they were kicked, not as the winner", () => {
    const game = startGame(DetroitBankruptcyMapSettings.key, {
      players: [RED, BLUE],
    });
    const kicked = game.currentPlayer;
    const survivor = kicked === RED ? BLUE : RED;

    game.kick(kicked);

    expect(game.hasEnded).toBe(true);
    // Score is "rounds lasted/income": the kicked player lasted round 1, and
    // the survivor must have outlasted them.
    expect(game.player(kicked).score).toBe("1/0");
    expect(game.player(survivor).score).toBe("2/0");
  });
});
