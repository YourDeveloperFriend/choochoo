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
import { DISFAVOR_TRACK, DISFAVOR_VALUES } from "./state";

export function DisfavorTrack() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const disfavorTrack = useInjectedState(DISFAVOR_TRACK);

  const positions = DISFAVOR_VALUES.map((_, index) => index);

  const playersAt = (position: number): PlayerColor[] => {
    const result: PlayerColor[] = [];
    for (const [color, index] of disfavorTrack) {
      if (index === position) {
        result.push(color);
      }
    }
    return result;
  };

  return (
    <Accordion fluid as={Menu} vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Stalin's Disfavor Track"
        />
        <AccordionContent active={expanded}>
          <Table celled compact unstackable size="small">
            <TableBody>
              <TableRow>
                <TableCell>Points</TableCell>
                {positions.map((position) => (
                  <TableCell key={position} textAlign="center">
                    {DISFAVOR_VALUES[position]}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Players</TableCell>
                {positions.map((position) => (
                  <TableCell key={position} textAlign="center">
                    {playersAt(position).map((color) => (
                      <PlayerBlock key={color} color={color} />
                    ))}
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

function PlayerBlock({ color }: { color: PlayerColor }) {
  return (
    <div className={`${styles.playerBlock} ${getPlayerColorCss(color)}`} />
  );
}
