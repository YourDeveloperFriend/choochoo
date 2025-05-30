import { PlayerCircle } from "../../client/game/bidding_info";
import { useInjectedState } from "../../client/utils/injection_context";
import { duplicate } from "../../utils/functions";
import { GOVERNMENT_TRACK } from "./government_track";
import * as styles from "./govt_build_order.module.css";
import {Accordion, AccordionContent, AccordionTitle, Menu, MenuItem} from "semantic-ui-react";
import {useState} from "react";

export function GovtBuildOrder() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const turnOrder = duplicate(3, useInjectedState(GOVERNMENT_TRACK)).flatMap(
    (i) => i,
  );

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
          <AccordionTitle
              active={expanded}
              index={0}
              onClick={() => setExpanded(!expanded)}
              content="Government Build Order"
          />
          <AccordionContent active={expanded}>
            <div className={styles.row}>
              {turnOrder.map((playerColor, index) => (
                <div key={index}>
                  <PlayerCircle
                    color={playerColor}
                    caption={`Round #${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
