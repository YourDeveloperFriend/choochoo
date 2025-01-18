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

  getPlayersRemaining(): number {
    return this.players().filter((p) => p.outOfGame !== true).length;
  }

  isSoloGame(): boolean {
    return this.players().length === 1;
  }

  getScore(player: PlayerData): Score {
    if (player.outOfGame) {
      return ELIMINATED;
    }
    return [this.calculateScore(player), 0];
  }

  /** Returns the players ordered by their score. Tied players end up in the same placement in the array. */
  getPlayersOrderedByScore(): PlayerData[][] {
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
        compareToIndex += ordered[compareToIndex].length;
        compareTo = score;
      }
      ordered[compareToIndex].push(player);
    }
    return ordered;
  }

  protected calculateScore(player: PlayerData): number {
    return (
      this.getScoreFromIncome(player) +
      this.getScoreFromShares(player) +
      this.getScoreFromTrack(player)
    );
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
          // Other track should not be claimed, but will be, so offset those track.
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
}

export const ELIMINATED = "Eliminated";
export type Eliminated = typeof ELIMINATED;

// Use a number array to represent a score, for tie breaking purposes.
// The earlier the number in the array, the more important it is for scoring purposes.
// If two scores have the same values, then it's a tie. Ties are possible for a lot of games.
export type Score = Eliminated | number[];

export function isEliminated(score: Score): score is Eliminated {
  return score === ELIMINATED;
}

export function isNotEliminated(score: Score): score is number[] {
  return !isEliminated(score);
}

export function compareScore(score1: Score, score2: Score): number {
  if (isEliminated(score1)) return -1;
  if (isEliminated(score2)) return 1;
  for (const [index, s1] of score1.entries()) {
    if (s1 > score2[index]) return -1;
    if (s1 < score2[index]) return 1;
  }
  return 0;
}
