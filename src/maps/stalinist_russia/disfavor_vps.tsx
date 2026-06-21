import * as styles from "../../client/game/final_overview.module.css";
import { RowProps } from "../../client/game/final_overview_row";
import { useInjected } from "../../client/utils/injection_context";
import { StalinistRussiaPlayerHelper } from "./disfavor";

export function DisfavorVps({ players }: RowProps) {
  const playerHelper = useInjected(StalinistRussiaPlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Stalin&apos;s Disfavor VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>
          {playerHelper.getScoreFromDisfavor(player)}
        </td>
      ))}
    </tr>
  );
}
