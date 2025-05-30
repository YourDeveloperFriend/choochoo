import { times } from "lodash";
import * as styles from "./loco_track.module.css";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Menu,
  MenuItem,
} from "semantic-ui-react";

export function LocoTrack() {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Locomotive Track"
        />
        <AccordionContent active={expanded}>
          <div>
            {...times(5, (i) => (
              <div key={i} className={styles.row}>
                {times(6, (j) => (
                  <LocoCell key={j} loco={j + 1} gvtLoco={4 - i} />
                ))}
              </div>
            ))}
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

interface LocoCellProps {
  loco: number;
  gvtLoco: number;
}

function isHidden({ loco, gvtLoco }: LocoCellProps): boolean {
  switch (loco) {
    case 1:
      return gvtLoco > 1;
    case 2:
    case 3:
      return gvtLoco > 2;
    case 4:
      return gvtLoco > 3;
    default:
      return false;
  }
}

function render(props: LocoCellProps): string {
  if (isHidden(props)) {
    return "";
  }
  return `${props.loco} + ${props.gvtLoco}`;
}

function LocoCell(props: LocoCellProps) {
  const hidden = isHidden(props);

  return (
    <div
      className={[styles.cell, hidden ? styles.hidden : undefined].join(" ")}
    >
      {render(props)}
    </div>
  );
}
