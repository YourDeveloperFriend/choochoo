
import { times } from "lodash";
import {useMemo, useState} from "react";
import { injectInGamePlayers } from "../../engine/game/state";
import { partition, peek } from "../../utils/functions";
import { useInject } from "../utils/injection_context";
import { PlayerCircle } from "./bidding_info";
import * as styles from "./income_track.module.css";
import {Accordion, AccordionContent, AccordionTitle, Menu, MenuItem} from "semantic-ui-react";

export function IncomeTrack() {
  const playerData = useInject(() => injectInGamePlayers()(), []);
  const [expanded, setExpanded] = useState<boolean>(false);

  const track = useMemo(() => {
    const maxIncome = Math.max(...playerData.map((player) => player.income));
    const byIncome = partition(playerData, (player) => player.income);
    const rows = Math.max(5, Math.floor(maxIncome - 1 / 10));
    const incomes = [
      times(11, (i) => i),
      ...times(rows - 1, (row) => times(10, (col) => (row + 1) * 10 + col + 1)),
    ];
    return incomes.map((row) =>
      row.map((value) => ({ value, players: byIncome.get(value) ?? [] })),
    );
  }, [playerData]);

  return (
    <Accordion as={Menu} vertical fluid>
      <MenuItem>
        <AccordionTitle active={expanded} index={0} onClick={() => setExpanded(!expanded)} content="Income Track" />
        <AccordionContent active={expanded}>
          <div className={styles.container}>
            {track.map((row, index) => (
              <div key={index} className={styles.row}>
                <div className={[styles.decrease, styles.cell].join(" ")}>
                  {index * -2}
                </div>
                {index !== 0 && <div className={styles.cell} />}
                {row.map(({ value, players }) => (
                  <div key={value} className={styles.cell}>
                    {players.slice(0, -1).map(({ color }) => (
                      <PlayerCircle key={color} color={color} />
                    ))}
                    <PlayerCircle color={peek(players)?.color}>
                      {value}
                    </PlayerCircle>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
