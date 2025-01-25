import { RowProps } from "../../client/game/final_overview_row";
import { useInjected } from "../../client/utils/injection_context";
import * as styles from "./final_overview.module.css";
import { SwedenPlayerHelper } from "./score";

export function GarbageVps({ players }: RowProps) {
  const playerHelper = useInjected(SwedenPlayerHelper);
  return (
    <tr>
      <th className={styles.label}>Garbage VPs</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>
          {playerHelper.getScoreFromGarbage(player)}
        </td>
      ))}
    </tr>
  );
}
