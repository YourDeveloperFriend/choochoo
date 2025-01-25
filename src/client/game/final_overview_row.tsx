import { ReactElement } from "react";
import { PlayerHelper } from "../../engine/game/player";
import { playerColorToString, PlayerData } from "../../engine/state/player";
import { useInjected } from "../utils/injection_context";
import * as styles from "./final_overview.module.css";

export interface RowProps {
  players: Array<{ player: PlayerData; placement: number }>;
}

export type RowFactory = (props: RowProps) => ReactElement;

export function Color({ players }: RowProps) {
  return (
    <tr>
      <th></th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerColorToString(player.color)}</td>
      ))}
    </tr>
  );
}

export function Place({ players }: RowProps) {
  return (
    <tr>
      <th className={styles.label}>Result</th>
      {players.map(({ player, placement }) => (
        <td key={player.playerId}>{getPlacement(placement)}</td>
      ))}
    </tr>
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

export function TotalVps({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Total VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.getScore(player)[0]}</td>
      ))}
    </tr>
  );
}

export function IncomeVps({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Income VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.getScoreFromIncome(player)}</td>
      ))}
    </tr>
  );
}

export function SharesVps({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Shares VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.getScoreFromShares(player)}</td>
      ))}
    </tr>
  );
}

export function TrackVps({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Track VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.getScoreFromTrack(player)}</td>
      ))}
    </tr>
  );
}

export function IncomeStat({ players }: RowProps) {
  return (
    <tr>
      <th className={styles.label}>Income</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{player.income}</td>
      ))}
    </tr>
  );
}

export function SharesStat({ players }: RowProps) {
  return (
    <tr>
      <th className={styles.label}>Shares</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{player.shares}</td>
      ))}
    </tr>
  );
}

export function TrackStat({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}># Track</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.countTrack(player.color)}</td>
      ))}
    </tr>
  );
}

export function MoneyStat({ players }: RowProps) {
  return (
    <tr>
      <th className={styles.label}>Money</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>${player.money}</td>
      ))}
    </tr>
  );
}

export function getRowList(): RowFactory[] {
  return [
    Color,
    Place,
    TotalVps,
    IncomeVps,
    SharesVps,
    TrackVps,
    IncomeStat,
    SharesStat,
    TrackStat,
    MoneyStat,
  ];
}
