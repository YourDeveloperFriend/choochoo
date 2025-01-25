import { RowProps } from "../../client/game/final_overview_row";
import { useInjected } from "../../client/utils/injection_context";
import { PlayerHelper } from "../../engine/game/player";
import * as styles from "./final_overview.module.css";

export function RoundsLasted({ players }: RowProps) {
  const playerHelper = useInjected(PlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Rounds Lasted</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{playerHelper.getScore(player)[0]}</td>
      ))}
    </tr>
  );
}
