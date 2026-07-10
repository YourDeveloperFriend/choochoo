import { assert, fail } from "../../utils/validate";
import { injectState } from "../framework/execution_context";
import { Land } from "../map/location";
import { MutablePlayerData, PlayerColor, PlayerData } from "../state/player";
import { CURRENT_PLAYER, injectAllPlayersUnsafe, injectGrid } from "./state";

export class PlayerHelper {
  protected readonly currentPlayer = injectState(CURRENT_PLAYER);
  protected readonly players = injectAllPlayersUnsafe();
  protected readonly grid = injectGrid();

  updateInGamePlayers(updateFn: (data: MutablePlayerData) => void): void {
    this.players.update((players) => {
      for (const player of players) {
        if (player.outOfGame) continue;
        updateFn(player);
      }
    });
  }

  update(
    playerColor: PlayerColor,
    updateFn: (data: MutablePlayerData) => void,
  ): void {
    this.players.update((players) => {
      const player = players.find((player) => player.color === playerColor);
      updateFn(player!);
    });
  }

  updateCurrentPlayer(updateFn: (data: MutablePlayerData) => void): void {
    return this.update(this.currentPlayer(), updateFn);
  }

  enoughPlayersEliminatedToEndGame(): boolean {
    const checkFor = this.isSoloGame() ? 0 : 1;
    return this.getPlayersRemaining() <= checkFor;
  }

  getRemainingPlayers(): PlayerData[] {
    return this.players().filter((p) => p.outOfGame !== true);
  }

  getPlayersRemaining(): number {
    return this.getRemainingPlayers().length;
  }

  isSoloGame(): boolean {
    return this.players().length === 1;
  }

  /**
   * Not meant to be overridden. Sums `getScoreBreakdown()` into the primary score and
   * appends `getScoreTiebreakers()`; override those instead to change scoring for a map.
   */
  getScore(player: PlayerData): Score {
    if (this.isEliminatedForScoring(player)) {
      return ELIMINATED;
    }
    let total = 0;
    for (const value of this.getScoreBreakdown(player).values()) {
      total += value;
    }
    return [total, ...this.getScoreTiebreakers(player)];
  }

  protected isEliminatedForScoring(player: PlayerData): boolean {
    return player.outOfGame === true;
  }

  /** Extra values appended after the primary score total, for tie-breaking purposes. */
  protected getScoreTiebreakers(_player: PlayerData): number[] {
    return [0];
  }

  /**
   * Returns every named contribution to this player's score, keyed by a human-readable
   * label. `getScore()` sums these values to compute the primary score total, so override
   * this method (not `getScore()`) to change what contributes to a map's scoring.
   */
  getScoreBreakdown(player: PlayerData): Map<ScoreBreakdownKey, number> {
    return new Map([
      ["Income points", this.getScoreFromIncome(player)],
      ["Share penalty", this.getScoreFromShares(player)],
      ["Track points", this.getScoreFromTrack(player)],
    ]);
  }

  beatSoloGoal(): boolean {
    assert(this.players().length === 1);
    const player = this.getSoloPlayer();
    if (player.outOfGame && this.outOfGameScoreIsLosing()) {
      return false;
    }
    const soloScore = this.getScore(player);
    return compareScore(soloScore, this.soloGoalScore()) <= 0;
  }

  protected outOfGameScoreIsLosing(): boolean {
    return true;
  }

  /** Returns the players ordered by their score. Tied players end up in the same placement in the array. */
  getPlayersOrderedByScore(): PlayerData[][] {
    if (this.players().length === 1) {
      const [player] = this.players();
      if (this.beatSoloGoal()) {
        return [[player]];
      }
      return [[], [player]];
    }
    const scores = this.players()
      .map((player) => ({ player, score: this.getScore(player) }))
      .sort(({ score: score1 }, { score: score2 }) =>
        compareScore(score1, score2),
      );
    const ordered: PlayerData[][] = [[]];
    let compareTo = scores[0].score;
    let compareToIndex = 0;
    for (const { score, player } of scores) {
      if (compareScore(compareTo, score) !== 0) {
        compareToIndex++;
        compareTo = score;
      }
      if (ordered[compareToIndex] == null) {
        ordered[compareToIndex] = [];
      }
      ordered[compareToIndex].push(player);
    }
    return ordered;
  }

  protected soloGoalScore(): Score {
    fail("not implemented");
  }

  getScoreFromIncome(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return 3 * player.income;
  }

  getScoreFromShares(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return -3 * player.shares;
  }

  getScoreFromTrack(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return this.countTrack(player.color);
  }

  countTrack(color: PlayerColor): number {
    let numTrack = 0;
    for (const space of this.grid().values()) {
      if (!(space instanceof Land)) continue;
      for (const track of space.getTrack()) {
        if (track.getOwner() !== color) continue;
        if (track.wasClaimed()) {
          // Other track should not be counted, but will be, so offset those track.
          numTrack += 2 - this.grid().getRoute(track).length;
        } else {
          numTrack++;
        }
      }
    }
    for (const interCityConnection of this.grid().connections) {
      if (interCityConnection.owner?.color === color) {
        numTrack++;
      }
    }
    return numTrack;
  }

  getPlayer(playerColor: PlayerColor): PlayerData {
    return this.players().find(({ color }) => color === playerColor)!;
  }

  getPlayerByPlayerId(playerId: number): PlayerData | undefined {
    return this.players().find((p) => p.playerId === playerId);
  }

  getSoloPlayer(): PlayerData {
    assert(this.players().length === 1);
    return this.players()[0];
  }
}

const ELIMINATED = "Eliminated";
type Eliminated = typeof ELIMINATED;

// Use a number array to represent a score, for tie breaking purposes.
// The earlier the number in the array, the more important it is for scoring purposes.
// If two scores have the same values, then it's a tie. Ties are possible for a lot of games.
export type Score = Eliminated | number[];

// A human-readable label identifying one contribution to a player's score, e.g.
// "Income points". Used as the key in getScoreBreakdown()'s result.
export type ScoreBreakdownKey = string;

function isEliminated(score: Score): score is Eliminated {
  return score === ELIMINATED;
}

// Compares [score1] to [score2].
// score1 < score2 = 1
// score2 < score1 = -1
// score1 = score2 = 0
function compareScore(score1: Score, score2: Score): number {
  if (isEliminated(score1) && isEliminated(score2)) return 0;
  if (isEliminated(score1)) return 1;
  if (isEliminated(score2)) return -1;
  for (const [index, s1] of score1.entries()) {
    if (score2[index] < s1) return -1;
    if (s1 < score2[index]) return 1;
  }
  return 0;
}
