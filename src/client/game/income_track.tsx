import { times } from "lodash";
import { useMemo, useState } from "react";
import { injectInGamePlayers } from "../../engine/game/state";
import { partition } from "../../utils/functions";
import { useInject } from "../utils/injection_context";
import * as styles from "./income_track.module.css";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { PlayerColor } from "../../engine/state/player";
import { getPlayerColorCss } from "../components/player_color";

export function IncomeTrack() {
  const playerData = useInject(() => injectInGamePlayers()(), []);
  const [expanded, setExpanded] = useState<boolean>(false);

  const track = useMemo(() => {
    const maxIncome = Math.max(...playerData.map((player) => player.income));
    const byIncome = partition(playerData, (player) => player.income);
    const rows = Math.max(7, 1 + Math.floor((maxIncome - 1) / 10));
    const incomes = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [undefined, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      [undefined, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      [undefined, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
      [undefined, 41, 42, 43, 44, 45, 46, 47, 48, 49, undefined],
      [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
      ...times(rows - 6, (row) => [
        undefined,
        ...times(10, (col) => (row + 6) * 10 + col + 1),
      ]),
    ];
    return incomes.map((row) =>
      row.map((value) =>
        value === undefined
          ? undefined
          : { value, players: byIncome.get(value) ?? [] },
      ),
    );
  }, [playerData]);

  return (
    <Accordion as={Menu} vertical fluid>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Income Track"
        />
        <AccordionContent active={expanded}>
          <p style={{ fontStyle: "italic" }}>
            Note that this represents the default income reduction; map-specific
            variations are not represented on this track.
          </p>
          <div style={{ overflowX: "scroll" }}>
            <Table celled compact unstackable size="small">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Income Reduction</TableHeaderCell>
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                  <TableHeaderCell />
                </TableRow>
              </TableHeader>
              <TableBody>
                {track.map((row, rowNum) => (
                  <TableRow key={rowNum}>
                    <TableCell>
                      {rowNum < 6 ? rowNum * -2 : undefined}
                    </TableCell>
                    {row.map((cellVal, idx) => (
                      <TableCell key={idx} textAlign="center">
                        {!cellVal ? undefined : (
                          <>
                            {cellVal.value}
                            <br />
                            {cellVal.players.map((player) => (
                              <PlayerBlock
                                key={player.color}
                                color={player.color}
                              />
                            ))}
                          </>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

function PlayerBlock({ color }: { color: PlayerColor }) {
  return (
    <div className={`${styles.playerBlock} ${getPlayerColorCss(color)}`} />
  );
}
