import * as styles from "./turn_track.module.css";
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
import {
  useInject,
  useInjectedState,
} from "../../client/utils/injection_context";
import { goodStyle } from "../../client/grid/good";
import { injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { TURN_TRACK_CUBES } from "./state";

/** Shows the cubes above the turn track that will be placed into Hāna on turns 2-4. */
export function TurnTrackCubes() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const cubes = useInjectedState(TURN_TRACK_CUBES);

  // Check that the current round is actually initialized, otherwise this causes an error on finished games
  const currentRound = useInject(() => {
    const state = injectState(ROUND);
    return state.isInitialized() ? state() : -1;
  }, []);

  if (currentRound === -1) {
    return <></>;
  }

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Hāna Cubes (Turn Track)"
        />
        <AccordionContent active={expanded}>
          <Table celled compact unstackable fixed>
            <TableBody>
              <TableRow>
                {cubes.map((_, idx) => (
                  <TableCell
                    key={idx}
                    style={{
                      backgroundColor:
                        idx + 1 === currentRound ? "#d8e1e8" : undefined,
                    }}
                  >
                    {idx + 1}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {cubes.map((good, idx) => (
                  <TableCell key={idx}>
                    {good != null && (
                      <div
                        className={`${styles.goodBlock} ${goodStyle(good)}`}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
