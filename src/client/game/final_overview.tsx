import { useMemo } from "react";
import { GameStatus } from "../../api/game";
import { PlayerHelper } from "../../engine/game/player";
import { MapRegistry } from "../../maps";
import { Username } from "../components/username";
import { useGame } from "../services/game";
import { useGameKey, useInjectedMemo } from "../utils/injection_context";
import * as styles from './final_overview.module.css';
import { getRowList, RowProps } from "./final_overview_row";

export function FinalOverview() {
  const game = useGame();
  if (game.status !== GameStatus.enum.ENDED) return <></>;

  return <FinalOverviewInternal />;
}

export function FinalOverviewInternal() {
  const playerHelper = useInjectedMemo(PlayerHelper);

  const playersOrdered = useMemo(() => {
    return playerHelper.value.getPlayersOrderedByScore()
      .flatMap((players, index) => players.map((player) => ({ player, placement: index + 1 })));
  }, [playerHelper]);


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
          <FinalOverviewRows players={playersOrdered} />
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
