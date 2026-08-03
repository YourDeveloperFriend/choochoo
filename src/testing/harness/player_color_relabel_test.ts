import { describe, expect, it } from "vitest";
import { injectState } from "../../engine/framework/execution_context";
import { TURN_ORDER } from "../../engine/game/state";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { PassAction } from "../../engine/turn_order/pass";
import {
  Playthrough,
  prepareForReplay,
  replayPlaythrough,
} from "./playthrough";
import { readGame } from "./read_game";
import {
  PlayerColorRelabel,
  buildPlayerColorRelabel,
  clearPlayerColorRelabels,
  registerActionPlayerColorRelabeller,
  registerPlayerColorField,
  relabelPlayerColorsIn,
} from "./player_color_relabel";
import { TestGame, startGame } from "./test_game";

const { RED, BLUE, YELLOW, GREEN } = PlayerColor;
const GAME_KEY = "rust-belt";

function turnOrderOf(game: TestGame): PlayerColor[] {
  return readGame(
    { gameKey: GAME_KEY, gameData: game.gameData, variant: {} },
    () => [...injectState(TURN_ORDER).getOr([])],
  );
}

/** Plays the opening phases, recording what was emitted. */
function playOpening(game: TestGame): Array<{ name: string; data: object }> {
  const actions: Array<{ name: string; data: object }> = [];
  const available = [Action.FIRST_BUILD, Action.FIRST_MOVE, Action.PRODUCTION];
  // Varied so the players end up with different scores. With everyone tied the
  // ordering within the tie carries no information and the comparison below
  // would not be testing anything.
  let shares = 0;
  let guard = 0;
  while (game.phase !== Phase.BUILDING && guard++ < 60) {
    switch (game.phase) {
      case Phase.SHARES: {
        const numShares = shares++ % 3;
        game.emit(TakeSharesAction, { numShares });
        actions.push({ name: "takeShares", data: { numShares } });
        break;
      }
      case Phase.TURN_ORDER:
        game.emit(PassAction, {});
        actions.push({ name: "pass", data: {} });
        break;
      case Phase.ACTION_SELECTION: {
        const action = available.shift()!;
        game.emit(SelectAction, { action });
        actions.push({ name: "select", data: { action } });
        break;
      }
      default:
        throw new Error(`unexpected phase ${game.phaseName}`);
    }
  }
  return actions;
}

describe("buildPlayerColorRelabel", () => {
  it("maps turn order positionally", () => {
    const relabel = buildPlayerColorRelabel(
      [RED, BLUE, YELLOW],
      [GREEN, RED, BLUE],
    );

    expect(relabel(RED)).toBe(GREEN);
    expect(relabel(BLUE)).toBe(RED);
    expect(relabel(YELLOW)).toBe(BLUE);
  });

  it("passes through a colour the recording never dealt", () => {
    const relabel = buildPlayerColorRelabel([RED], [BLUE]);

    // Rather than silently rewriting something it has no mapping for.
    expect(relabel(GREEN)).toBe(GREEN);
  });

  it("refuses a mismatched player count", () => {
    expect(() => buildPlayerColorRelabel([RED, BLUE], [GREEN])).toThrow(
      /2 players but the replay dealt 1/,
    );
  });
});

describe("relabelPlayerColorsIn", () => {
  const relabel = buildPlayerColorRelabel([RED, BLUE], [YELLOW, GREEN]);

  it("rewrites the owners along a delivery path", () => {
    const data = {
      good: 2,
      startingCity: { q: 1, r: 2 },
      path: [
        { endingStop: { q: 2, r: 2 }, owner: RED },
        { endingStop: { q: 3, r: 2 }, owner: BLUE },
        { endingStop: { q: 4, r: 2 } },
      ],
    };

    expect(relabelPlayerColorsIn("move", data, relabel)).toEqual({
      good: 2,
      startingCity: { q: 1, r: 2 },
      path: [
        { endingStop: { q: 2, r: 2 }, owner: YELLOW },
        { endingStop: { q: 3, r: 2 }, owner: GREEN },
        { endingStop: { q: 4, r: 2 } },
      ],
    });
  });

  it("rewrites Alabama's forgo and Moon's stealFrom", () => {
    expect(
      relabelPlayerColorsIn("move", { path: [], forgo: RED }, relabel),
    ).toEqual({ path: [], forgo: YELLOW });

    expect(
      relabelPlayerColorsIn(
        "move",
        { path: [], stealFrom: { color: BLUE } },
        relabel,
      ),
    ).toEqual({ path: [], stealFrom: { color: GREEN } });
  });

  it("rewrites Chesapeake and Ohio's factory colour", () => {
    expect(
      relabelPlayerColorsIn(
        "build",
        { coordinates: { q: 0, r: 0 }, factoryColor: RED },
        relabel,
      ),
    ).toEqual({ coordinates: { q: 0, r: 0 }, factoryColor: YELLOW });
  });

  it("leaves a good's colour alone", () => {
    // Good and PlayerColor overlap numerically, so a field called `color` is
    // deliberately not rewritten. Rewriting it would corrupt the good silently.
    expect(
      relabelPlayerColorsIn(
        "production",
        { good: RED, color: 2, row: 0 },
        relabel,
      ),
    ).toEqual({ good: RED, color: 2, row: 0 });
  });

  it("lets a map register a rewriter for an unusual payload", () => {
    try {
      registerActionPlayerColorRelabeller(
        "odd-action",
        (data, relabelPlayerColor: PlayerColorRelabel) => {
          const typed = data as { whoseTrack: number };
          return { whoseTrack: relabelPlayerColor(typed.whoseTrack) };
        },
      );

      expect(
        relabelPlayerColorsIn("odd-action", { whoseTrack: RED }, relabel),
      ).toEqual({ whoseTrack: YELLOW });
    } finally {
      clearPlayerColorRelabels();
    }
  });
});

describe("colours are fungible", () => {
  it("plays out identically when the colours are relabelled", () => {
    // The claim the whole approach rests on: a game replayed from its seed with
    // a different colour assignment is the same game under a renaming. Tested on
    // a game generated here, since a recording from production predates the
    // changes that made setup reproducible.
    const withPreferences = startGame(GAME_KEY, {
      players: [RED, BLUE, YELLOW],
      seed: "fungible",
    });
    // The same seed, dealt without preferences: a different assignment, and the
    // board must be identical.
    const withoutPreferences = startGame(GAME_KEY, {
      players: 3,
      seed: "fungible",
    });

    // Both orders read before anything is played. Turn order changes during
    // bidding, so a mapping built from one game before and the other after would
    // be comparing different moments.
    const relabel = buildPlayerColorRelabel(
      turnOrderOf(withPreferences),
      turnOrderOf(withoutPreferences),
    );

    const recorded = playOpening(withPreferences);

    for (const action of recorded) {
      withoutPreferences.emitRaw(
        action.name,
        relabelPlayerColorsIn(action.name, action.data, relabel),
      );
    }

    // Same phase, same round, and every player's position matches once their
    // colour is mapped across.
    expect(withoutPreferences.phase).toBe(withPreferences.phase);
    expect(withoutPreferences.round).toBe(withPreferences.round);
    expect(turnOrderOf(withoutPreferences)).toEqual(
      turnOrderOf(withPreferences).map(relabel),
    );

    for (const player of withPreferences.snapshot().players) {
      const counterpart = withoutPreferences
        .snapshot()
        .players.find(
          (candidate) =>
            candidate.color ===
            playerColorName(relabel(colorFromName(player.color))),
        );
      expect(counterpart, `no counterpart for ${player.color}`).toBeDefined();
      expect(counterpart!.money).toBe(player.money);
      expect(counterpart!.income).toBe(player.income);
      expect(counterpart!.shares).toBe(player.shares);
      expect(counterpart!.selectedAction).toBe(player.selectedAction);
    }
  });
});

const COLOR_NAMES: Record<string, PlayerColor> = {
  red: PlayerColor.RED,
  yellow: PlayerColor.YELLOW,
  green: PlayerColor.GREEN,
  purple: PlayerColor.PURPLE,
  black: PlayerColor.BLACK,
  blue: PlayerColor.BLUE,
  brown: PlayerColor.BROWN,
  white: PlayerColor.WHITE,
  pink: PlayerColor.PINK,
};

function colorFromName(name: string): PlayerColor {
  const color = COLOR_NAMES[name];
  if (color == null) throw new Error(`unknown colour name "${name}"`);
  return color;
}

function playerColorName(color: PlayerColor): string {
  return Object.entries(COLOR_NAMES).find(([, value]) => value === color)![0];
}

describe("prepareForReplay", () => {
  /** Builds a recording of the shape the export endpoint produces. */
  function record(colors: PlayerColor[], seed: string): Playthrough {
    const game = startGame(GAME_KEY, { players: colors, seed });
    const startState = game.gameData;
    const actions = playOpening(game).map((action, index) => ({
      version: index + 1,
      actionName: action.name,
      actionData: action.data,
      seed: null,
    }));
    return {
      id: 1,
      gameKey: GAME_KEY,
      variant: {},
      playerIds: colors.map((_, index) => index + 1),
      startSeed: seed,
      startState,
      replayFrom: "state",
      actions,
    };
  }

  it("switches a reproducible recording to replay from its seed", () => {
    const prepared = prepareForReplay(record([GREEN, RED, BLUE], "prep-seed"));

    // The point of the exercise: nothing about the opening is carried, so every
    // replay re-asserts that setup is reproducible from the seed.
    expect(prepared.replayFrom).toBe("seed");
    expect(prepared.startState).toBeUndefined();
    expect(prepared.playerColorRelabel).toMatch(/->/);
  });

  it("produces a recording that replays cleanly", () => {
    const prepared = prepareForReplay(
      record([GREEN, RED, BLUE], "prep-replay"),
    );
    const result = replayPlaythrough(prepared);

    expect(result.failure).toBeUndefined();
    expect(result.actionsApplied).toBe(prepared.actions.length);
  });

  it("reaches the same position as the recording it came from", () => {
    const original = record([GREEN, RED, BLUE], "prep-same");
    const prepared = prepareForReplay(original);

    // Replaying the original from its recorded state and the prepared one from
    // its seed must agree on everything but the names of the colours, which is
    // what makes relabelling sound.
    const fromState = replayPlaythrough(original);
    const fromSeed = replayPlaythrough(prepared);

    // Strips the colour, and its padding, from both the round lines and the
    // numbered standings. The padding has to go too: colour names differ in
    // length, so leaving it would compare alignment rather than outcomes.
    const stripColors = (transcript: string) =>
      transcript.replace(/^(\s+(?:\d+\. )?)\w+\s+/gm, "$1PLAYER ");
    expect(stripColors(fromSeed.transcript)).toBe(
      stripColors(fromState.transcript),
    );
  });

  it("keeps the recorded opening when the seed cannot reproduce it", () => {
    const recording = record([GREEN, RED, BLUE], "prep-drift");
    // Stand in for a game played before setup was reproducible: the seed no
    // longer deals this board.
    const drifted: Playthrough = {
      ...recording,
      startSeed: "a-different-seed",
    };
    const notes: string[] = [];

    const prepared = prepareForReplay(drifted, (message) =>
      notes.push(message),
    );

    expect(prepared.replayFrom).toBe("state");
    expect(prepared.startState).toBeDefined();
    expect(notes.join("\n")).toMatch(/cannot be re-derived from its seed/);
  });
});

describe("registerPlayerColorField", () => {
  it("lets a map declare another colour-bearing field", () => {
    const relabel = buildPlayerColorRelabel([RED], [BLUE]);

    // Before declaring it, the field is left alone: the list is deliberately
    // exact, because Good and PlayerColor overlap numerically.
    expect(
      relabelPlayerColorsIn("whatever", { conductor: RED }, relabel),
    ).toEqual({
      conductor: RED,
    });

    registerPlayerColorField("conductor");
    expect(
      relabelPlayerColorsIn("whatever", { conductor: RED }, relabel),
    ).toEqual({
      conductor: BLUE,
    });
  });
});
