import { useMemo } from "react";
import { GameStatus } from "../../api/game";
import { isEliminated, PlayerHelper } from "../../engine/game/player";
import { injectAllPlayersUnsafe } from "../../engine/game/state";
import { playerColorToString } from "../../engine/state/player";
import { SwedenPlayerHelper } from "../../maps/sweden/score";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { deepEquals } from "../../utils/deep_equals";
import { Username } from "../components/username";
import { useGame } from "../services/game";
import {
  useGameKey,
  useInject,
  useInjectedMemo,
} from "../utils/injection_context";
import * as styles from "./final_overview.module.css";

export function FinalOverview() {
  const game = useGame();
  if (game.status !== GameStatus.enum.ENDED) return <></>;

  return <FinalOverviewInternal />;
}

export function FinalOverviewInternal() {
  const gameKey = useGameKey();
  const players = useInject(() => injectAllPlayersUnsafe()(), []);
  const playerHelper = useInjectedMemo(PlayerHelper);
  const playersOrdered = useMemo(() => {
    const playerData = players.map((player) => ({
      player,
      score: playerHelper.value.getScore(player),
    }));
    return playerData.sort((p1, p2) => {
      if (isEliminated(p1.score)) return 1;
      if (isEliminated(p2.score)) return -1;
      const p1Score = p1.score;
      return p2.score.every((score, index) => score >= p1Score[index]) ? 1 : -1;
    });
  }, [players, playerHelper]);
  const placement = useMemo(() => {
    return playersOrdered.map(({ score }, index) => {
      while (index > 0 && deepEquals(playersOrdered[index - 1].score, score)) {
        index--;
      }
      return index + 1;
    });
  }, [playersOrdered]);
  return (
    <div className={styles.finalOverview}>
      <h2>Final Overview</h2>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th></th>
              {playersOrdered.map(({ player }, index) => (
                <th key={player.playerId}>
                  {placement[index] === 1 ? "☆ " : ""}
                  <Username userId={player.playerId} />
                  {placement[index] === 1 ? " ☆" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th></th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>
                  {playerColorToString(player.color)}
                </td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Result</th>
              {playersOrdered.map(({ player }, index) => (
                <td key={player.playerId}>{getPlacement(placement[index])}</td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Total VPs</th>
              {playersOrdered.map(({ player, score }) => (
                <td key={player.playerId}>{score}</td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Income VPs</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>
                  {playerHelper.getScoreFromIncome(player)}
                </td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Shares VPs</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>
                  {playerHelper.getScoreFromShares(player)}
                </td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Track VPs</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>
                  {playerHelper.getScoreFromTrack(player)}
                </td>
              ))}
            </tr>
            {gameKey === SwedenRecyclingMapSettings.key && (
              <tr>
                <th className={styles.label}>Garbage VPs</th>
                {playersOrdered.map(({ player }) => (
                  <td key={player.playerId}>
                    {(playerHelper as SwedenPlayerHelper).getScoreFromGarbage(
                      player,
                    )}
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <th className={styles.label}>Income</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>{player.income}</td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Shares</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>{player.shares}</td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}># Track</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>
                  {playerHelper.countTrack(player.color)}
                </td>
              ))}
            </tr>
            <tr>
              <th className={styles.label}>Money</th>
              {playersOrdered.map(({ player }) => (
                <td key={player.playerId}>${player.money}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPlacement(placement: number): string {
  switch (placement) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return `${placement}th`;
  }
}
