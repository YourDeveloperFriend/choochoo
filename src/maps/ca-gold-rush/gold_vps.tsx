import { RowProps } from "../../client/game/final_overview_row";
import { useInjectedState } from "../../client/utils/injection_context";
import * as styles from "../../client/game/final_overview.module.css";
import { OwnedGold } from "./score";

export function GoldVps({ players }: RowProps) {
  const gold = useInjectedState(OwnedGold);
  return (
    <tr>
      <th className={styles.label}>Gold VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>{15 * gold.get(player.color)!}</td>
      ))}
    </tr>
  );
}
