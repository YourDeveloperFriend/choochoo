import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "semantic-ui-react";
import { AvailableCity } from "../../client/game/available_cities";
import {
  useActiveGameState,
  useGrid,
} from "../../client/utils/injection_context";
import { iterate } from "../../utils/functions";
import { ROUND } from "../../engine/game/round";
import { MUNICIPAL_DEVELOPMENTS } from "./municipal_development";
import * as styles from "./municipal_development_slider.module.css";

// The rendered available cities are 180px wide, so a column must be at least
// that wide for them not to need their own scroll bar. The whole table scrolls
// horizontally instead when it doesn't fit.
const CITY_WIDTH = 180;
// Columns for current and past rounds, which have no development to show.
const PAST_ROUND_WIDTH = 40;

export function MunicipalDevelopment() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const pending = useActiveGameState(MUNICIPAL_DEVELOPMENTS);
  const grid = useGrid();

  const currentRound = useActiveGameState(ROUND);

  if (pending == null || pending.length === 0 || currentRound == null) {
    return <></>;
  }

  const tableWidth =
    currentRound * PAST_ROUND_WIDTH + pending.length * CITY_WIDTH;

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Municipal Development"
        />
        <AccordionContent active={expanded}>
          <div className={styles.scroller}>
            <Table
              celled
              compact
              unstackable
              fixed
              style={{ minWidth: tableWidth }}
            >
              <TableBody>
                <TableRow>
                  {iterate(currentRound + pending.length, (idx) => (
                    <TableCell
                      key={idx}
                      style={{
                        width:
                          idx < currentRound ? PAST_ROUND_WIDTH : CITY_WIDTH,
                      }}
                      className={
                        idx + 1 === currentRound
                          ? styles.currentRound
                          : undefined
                      }
                    >
                      {idx + 1}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {iterate(currentRound, (idx) => (
                    <TableCell key={`empty-${idx}`} />
                  ))}
                  {pending.map(({ coordinates }, idx) => (
                    <TableCell key={idx}>
                      {grid.displayName(coordinates)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {iterate(currentRound, (idx) => (
                    <TableCell key={`empty-${idx}`} />
                  ))}
                  {pending.map(({ city }, idx) => (
                    <TableCell key={idx}>
                      {/* HexGrid sizes itself by measuring, which gives 0x0 while the accordion is collapsed (display: none), so only mount it once expanded. */}
                      {expanded && <AvailableCity city={city} />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
