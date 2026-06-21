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
import { getPlayerColorCss } from "../../client/components/player_color";
import { useInjectedState } from "../../client/utils/injection_context";
import { PlayerColor } from "../../engine/state/player";
import * as styles from "./loco_track.module.css";
import { LOCO_TRACK } from "./state";
import {
  costToAdvanceInto,
  describeBox,
  LocoRow,
  MAX_LOCO_BOX,
} from "./track_data";

export function LocoTrack() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const locoTrack = useInjectedState(LOCO_TRACK);

  const boxes = Array.from({ length: MAX_LOCO_BOX + 1 }, (_, box) => box);

  const playersAt = (box: number, row: LocoRow): PlayerColor[] => {
    const result: PlayerColor[] = [];
    for (const [color, position] of locoTrack) {
      if (position.box === box && position.row === row) {
        result.push(color);
      }
    }
    return result;
  };

  const renderRow = (row: LocoRow, label: string) => (
    <TableRow>
      <TableCell>{label}</TableCell>
      {boxes.map((box) => (
        <TableCell key={box} textAlign="center">
          <div>{describeBox(box, row)}</div>
          <div>
            {playersAt(box, row).map((color) => (
              <PlayerBlock key={color} color={color} />
            ))}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );

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
          <Table celled compact unstackable size="small">
            <TableBody>
              <TableRow>
                <TableCell>Round</TableCell>
                {boxes.map((box) => (
                  <TableCell key={box} textAlign="center">
                    {box}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Cost</TableCell>
                {boxes.map((box) => (
                  <TableCell key={box} textAlign="center">
                    {box === 0 ? "—" : `$${costToAdvanceInto(box)}`}
                  </TableCell>
                ))}
              </TableRow>
              {renderRow(LocoRow.MANY, "Many players")}
              {renderRow(LocoRow.SINGLE, "Single player")}
            </TableBody>
          </Table>
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
