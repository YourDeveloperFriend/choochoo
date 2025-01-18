import { useMemo } from "react";
import { GameStatus } from "../../api/game";
import { PlayerHelper } from "../../engine/game/player";
import { injectAllPlayersUnsafe } from "../../engine/game/state";
import { playerColorToString } from "../../engine/state/player";
import { SwedenPlayerHelper } from "../../maps/sweden/score";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
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
  const playerHelper = useInjectedMemo(PlayerHelper);
  const isDetroit = gameKey === DetroitBankruptcyMapSettings.key;

  const playersOrdered = useMemo(() => {
    const players = playerHelper.value.getPlayersOrderedByScore()
      .flatMap((players, index) => players.map((player) => ({ player, placement: index + 1 })));
    if (players.length === 1 && isDetroit) {
      return [];
    }
    return players;
    }, [playerHelper, isDetroit]);


  return <div className={styles.finalOverview}>
    <h2>Final Overview</h2>
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            <th></th>
            {playersOrdered.map(({ player, placement }) => <th key={player.playerId}>
              {placement === 1 ? '☆ ' : ''}
              <Username userId={player.playerId} />
              {placement === 1 ? ' ☆' : ''}
            </th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th></th>
            {playersOrdered.map(({ player }) => <td key={player.playerId}>
              {playerColorToString(player.color)}
            </td>)}
          </tr>
          <tr>
            <th className={styles.label}>Result</th>
            {playersOrdered.map(({ player, placement }) =>
              <td key={player.playerId}>{getPlacement(placement)}</td>)}
          </tr>
          <tr>
            <th className={styles.label}>
              {isDetroit ? 'Rounds lasted' : 'Total VPs'}
            </th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{playerHelper.value.getScore(player)[0]}</td>)}
          </tr>
          {!isDetroit && <tr>
            <th className={styles.label}>Income VPs</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{playerHelper.value.getScoreFromIncome(player)}</td>)}
          </tr>}
          {!isDetroit && <tr>
            <th className={styles.label}>Shares VPs</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{playerHelper.value.getScoreFromShares(player)}</td>)}
          </tr>}
          {!isDetroit && <tr>
            <th className={styles.label}>Track VPs</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{playerHelper.value.getScoreFromTrack(player)}</td>)}
          </tr>}
          {gameKey === SwedenRecyclingMapSettings.key && <tr>
            <th className={styles.label}>Garbage VPs</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{(playerHelper.value as SwedenPlayerHelper).getScoreFromGarbage(player)}</td>)}
          </tr>}
          <tr>
            <th className={styles.label}>Income</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{player.income}</td>)}
          </tr>
          <tr>
            <th className={styles.label}>Shares</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{player.shares}</td>)}
          </tr>
          <tr>
            <th className={styles.label}># Track</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>{playerHelper.value.countTrack(player.color)}</td>)}
          </tr>
          <tr>
            <th className={styles.label}>Money</th>
            {playersOrdered.map(({ player }) =>
              <td key={player.playerId}>${player.money}</td>)}
          </tr>
        </tbody>
      </table>
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
