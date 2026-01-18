import * as styles from "./loop_demand_chart.module.css";
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
import { THE_LOOP_DEMAND } from "./starter";
import { iterate } from "../../utils/functions";
import { Good } from "../../engine/state/good";
import { goodStyle } from "../../client/grid/good";
import { ROUND } from "../../engine/game/round";
import { injectState } from "../../engine/framework/execution_context";

export function LoopDemandChart() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const loopDemand = useInjectedState(THE_LOOP_DEMAND);

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
          content="The Loop Demand"
        />
        <AccordionContent active={expanded}>
          <div>
            <Table celled compact unstackable fixed>
              <TableBody>
                <TableRow>
                  {iterate(currentRound, () => (
                    <TableCell />
                  ))}
                  {loopDemand.map((good, idx) => (
                    <TableCell key={currentRound + idx}>
                      <GoodBlock good={good} />
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

function GoodBlock({ good }: { good: Good }) {
  return <div className={`${styles.goodBlock} ${goodStyle(good)}`} />;
}
