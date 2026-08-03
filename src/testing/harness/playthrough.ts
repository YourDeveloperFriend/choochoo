import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { inject, injectState } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { ROUND } from "../../engine/game/round";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { readGame } from "./read_game";
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
   * The state just after setup.
   *
   * Replay resumes from here rather than re-deriving it from the seed. Games
   * recorded before setup became reproducible cannot be re-derived at all, and
   * even for newer ones this keeps the recording testing the game that was
   * actually played rather than whatever the current map layout would deal.
   */
  startState: string;
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
      return helper.getPlayersOrderedByScore().flatMap((tied) =>
        tied.map((player) => ({
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

/** Replays a recording and renders its transcript. */
export function replayPlaythrough(playthrough: Playthrough): PlaythroughResult {
  const game = TestGame.fromState(playthrough.gameKey, playthrough.startState, {
    variant: playthrough.variant,
    seed: playthrough.startSeed ?? undefined,
  });

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
