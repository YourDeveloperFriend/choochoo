import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { ROUND } from "../../engine/game/round";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { TURN_ORDER } from "../../engine/game/state";
import { readGame } from "./read_game";
import {
  buildPlayerColorRelabel,
  describePlayerColorRelabel,
  relabelPlayerColorsIn,
} from "./player_color_relabel";
import { TestGame } from "./test_game";

/**
 * Replays a recorded game and reports what happened, for comparison against a
 * committed transcript.
 *
 * The recording is a real game exported from production (see the /export
 * endpoint), so the sequence of actions is realistic in a way no bot produces:
 * it exercises the rules players actually reach, including a map's own actions.
 *
 * Two things are asserted, and deliberately only two:
 *
 *   - Every recorded action still validates and applies. This is the strongest
 *     signal in the suite. A rules change that makes a previously legal move
 *     illegal stops the replay dead, naming the action and round.
 *   - The player stats at each round boundary, and the final standings, match
 *     the transcript.
 *
 * The board is deliberately not asserted. Whether a move is legal is mostly
 * derived from the board, so a diverged board shows up as an action that no
 * longer validates -- which is both earlier and more informative than a diff of
 * several hundred spaces.
 */

/** A recorded game, as the export endpoint produces it. */
export interface Playthrough {
  id: number;
  gameKey: GameKey;
  variant: VariantConfig;
  playerIds: number[];
  startSeed: string | null;
  /**
   * How the opening is reconstructed.
   *
   * "seed" is the intended form: the game is started afresh from startSeed and
   * playerIds, which asserts that setting a game up really is reproducible from
   * its seed. The actions have been relabelled onto whatever colours the seed
   * deals, since which player holds which colour is not reproducible -- colour
   * preferences are read from the users at start time and recorded nowhere --
   * but players are interchangeable, so the game is the same under a renaming.
   *
   * "state" is for games recorded before setup became reproducible, whose
   * openings cannot be re-derived at all. Such a recording carries startState.
   */
  replayFrom: "seed" | "state";
  /**
   * The state just after setup. Only present when replayFrom is "state".
   */
  startState?: string;
  /**
   * The player-colour mapping applied to the actions, for the record.
   *
   * Only meaningful when replayFrom is "seed". Purely descriptive: the actions
   * are already relabelled.
   */
  playerColorRelabel?: string;
  actions: Array<{
    version: number;
    actionName: string;
    actionData: unknown;
    seed: string | null;
  }>;
}

interface PlaythroughResult {
  /** The rendered transcript, for comparison against the committed one. */
  transcript: string;
  actionsApplied: number;
  /** Set when an action stopped validating. */
  failure?: string;
  endedNaturally: boolean;
}

interface PlayerLine {
  color: PlayerColor;
  money: number;
  income: number;
  shares: number;
  locomotive: number;
  score: string;
  outOfGame: boolean;
}

function pad(value: string, width: number): string {
  return value.length >= width
    ? value
    : value + " ".repeat(width - value.length);
}

function readPlayers(game: TestGame, playthrough: Playthrough): PlayerLine[] {
  return readGame(
    {
      gameKey: playthrough.gameKey,
      gameData: game.gameData,
      variant: playthrough.variant,
    },
    () => {
      const helper = inject(PlayerHelper);
      // Ordered by score so the final block doubles as the standings. Ties share
      // a place, which getPlayersOrderedByScore already groups for us.
      // Players tied on score are ordered by colour, not by the engine's
      // internal player array. That array's order is not meaningful and is not
      // preserved when a recording is relabelled, so leaving it to decide would
      // make a tie render differently run to run.
      return helper.getPlayersOrderedByScore().flatMap((tied) =>
        [...tied]
          .sort((a, b) =>
            playerColorToString(a.color) < playerColorToString(b.color)
              ? -1
              : 1,
          )
          .map((player) => ({
            color: player.color,
            money: player.money,
            income: player.income,
            shares: player.shares,
            locomotive: player.locomotive,
            score: describeScore(helper.getScore(player)),
            outOfGame: player.outOfGame === true,
          })),
      );
    },
  );
}

function describeScore(score: unknown): string {
  return Array.isArray(score) ? score.join("/") : String(score);
}

function readRound(
  game: TestGame,
  playthrough: Playthrough,
): number | undefined {
  return readGame(
    {
      gameKey: playthrough.gameKey,
      gameData: game.gameData,
      variant: playthrough.variant,
    },
    () => {
      const round = injectState(ROUND);
      return round.isInitialized() ? round() : undefined;
    },
  );
}

function renderPlayers(players: PlayerLine[], numbered: boolean): string[] {
  return players.map((player, index) => {
    const place = numbered ? `${index + 1}. ` : "   ";
    return (
      "  " +
      place +
      [
        pad(playerColorToString(player.color), 7),
        pad(`$${player.money}`, 5),
        pad(`income=${player.income}`, 11),
        pad(`shares=${player.shares}`, 10),
        pad(`loco=${player.locomotive}`, 7),
        pad(`score=${player.score}`, 14),
        player.outOfGame ? "OUT" : "",
      ]
        .join(" ")
        .trimEnd()
    );
  });
}

/**
 * Chooses how a recording will be replayed, preferring the seed.
 *
 * Replaying from the seed is the point: it makes every recording a standing
 * check that setting up a game is reproducible from its seed alone, so no part
 * of the opening has to be carried around. What the seed does not fix is which
 * player holds which colour -- preferences are read from the users at start time
 * and recorded nowhere -- so the actions are relabelled onto the colours the seed
 * deals. Players are interchangeable, so that is the same game renamed.
 *
 * A game recorded before setup became reproducible keeps its recorded opening
 * instead. Those cannot be re-derived at all, and are expected to dwindle.
 */
export function prepareForReplay(
  playthrough: Playthrough,
  note: (message: string) => void = () => {},
): Playthrough {
  if (playthrough.startSeed == null || playthrough.startState == null) {
    return { ...playthrough, replayFrom: "state" };
  }

  const fresh = TestGame.fromSeed(playthrough.gameKey, {
    seed: playthrough.startSeed,
    players: playthrough.playerIds.length,
    variant: playthrough.variant,
  });

  const recordedBoard = boardOf(playthrough.gameKey, playthrough.startState);
  const replayedBoard = boardOf(playthrough.gameKey, fresh.gameData);
  if (recordedBoard !== replayedBoard) {
    note(
      `  note: this game's opening cannot be re-derived from its seed, so the\n` +
        `        recorded opening is kept. Expected for games played before the\n` +
        `        engine's setup became reproducible.`,
    );
    return { ...playthrough, replayFrom: "state" };
  }

  const relabel = buildPlayerColorRelabel(
    turnOrderOf(playthrough.gameKey, playthrough.startState),
    turnOrderOf(playthrough.gameKey, fresh.gameData),
  );
  const description = describePlayerColorRelabel(
    turnOrderOf(playthrough.gameKey, playthrough.startState),
    turnOrderOf(playthrough.gameKey, fresh.gameData),
  );

  return {
    ...playthrough,
    replayFrom: "seed",
    startState: undefined,
    playerColorRelabel: description,
    actions: playthrough.actions.map((action) => ({
      ...action,
      actionData: relabelPlayerColorsIn(
        action.actionName,
        action.actionData,
        relabel,
      ),
    })),
  };
}

const BOARD_KEYS = ["grid", "bag", "availableCities", "interCityConnections"];

function boardOf(_gameKey: string, gameData: string): string {
  const state = JSON.parse(gameData).gameData as Record<string, unknown>;
  return JSON.stringify(BOARD_KEYS.map((key) => state[key]));
}

function turnOrderOf(gameKey: string, gameData: string): PlayerColor[] {
  return readGame({ gameKey, gameData }, () => [
    ...injectState(TURN_ORDER).getOr([]),
  ]);
}

/**
 * Reconstructs the opening of a recorded game.
 *
 * From the seed where the recording supports it, which makes every replay a
 * check that setup is still reproducible; otherwise from the recorded state.
 */
function openPlaythrough(playthrough: Playthrough): TestGame {
  if (playthrough.replayFrom === "seed") {
    if (playthrough.startSeed == null) {
      throw new Error(
        `recording ${playthrough.id} claims to replay from its seed but has none`,
      );
    }
    return TestGame.fromSeed(playthrough.gameKey, {
      seed: playthrough.startSeed,
      players: playthrough.playerIds.length,
      variant: playthrough.variant,
    });
  }

  if (playthrough.startState == null) {
    throw new Error(
      `recording ${playthrough.id} replays from a recorded state but has none`,
    );
  }
  return TestGame.fromState(playthrough.gameKey, playthrough.startState, {
    variant: playthrough.variant,
    seed: playthrough.startSeed ?? undefined,
  });
}

/** Replays a recording and renders its transcript. */
export function replayPlaythrough(playthrough: Playthrough): PlaythroughResult {
  const game = openPlaythrough(playthrough);

  const lines: string[] = [
    `game ${playthrough.id} / ${playthrough.gameKey} / ${playthrough.playerIds.length} players / ${playthrough.actions.length} actions`,
  ];

  let round = readRound(game, playthrough);
  let applied = 0;
  let failure: string | undefined;

  for (const action of playthrough.actions) {
    try {
      game.emitRaw(
        action.actionName,
        action.actionData,
        action.seed ?? undefined,
      );
    } catch (e) {
      failure =
        `action ${applied + 1} of ${playthrough.actions.length} ` +
        `(recorded version ${action.version}, "${action.actionName}") ` +
        `no longer applies in round ${round ?? "?"}: ` +
        (e as Error).message.split("\n")[0];
      break;
    }
    applied++;

    // Reuses the snapshot the referee already built. Building one walks the grid
    // and traces every player's routes, so reading the state again here cost as
    // much as the action itself.
    const nextRound = game.lastSnapshot.round;
    if (nextRound !== round) {
      if (round != null) {
        lines.push(`round ${round} end`);
        lines.push(...renderPlayers(readPlayers(game, playthrough), false));
      }
      round = nextRound;
    }

    if (game.hasEnded) break;
  }

  if (failure == null) {
    lines.push("final standings");
    lines.push(...renderPlayers(readPlayers(game, playthrough), true));
  }

  return {
    transcript: lines.join("\n") + "\n",
    actionsApplied: applied,
    failure,
    endedNaturally: game.hasEnded,
  };
}
