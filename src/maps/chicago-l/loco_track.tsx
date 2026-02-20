import * as styles from "./loco_track.module.css";
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
import { PlayerColor } from "../../engine/state/player";
import { getPlayerColorCss } from "../../client/components/player_color";
import { injectInGamePlayers } from "../../engine/game/state";
import {
  useInject,
  useInjectedState,
} from "../../client/utils/injection_context";
import { GOVERNMENT_ENGINE_LEVEL } from "./starter";

export function LocoTrack() {
  const [expanded, setExpanded] = useState<boolean>(false);
  const playerData = useInject(() => injectInGamePlayers()(), []);
  const playerGovtLoco = useInjectedState(GOVERNMENT_ENGINE_LEVEL);
  const getPlayers = (govtLoco: number, loco: number): PlayerColor[] => {
    const result = [];
    for (const player of playerData) {
      if (
        player.locomotive === loco &&
        playerGovtLoco.get(player.color) === govtLoco
      ) {
        result.push(player.color);
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
          content="Locomotive Track"
        />
        <AccordionContent active={expanded}>
          <Table celled compact unstackable fixed>
            <TableBody>
              <TableRow>
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <LocoCell row={4} loco={7} players={getPlayers(4, 7)} />
                <TableCell style={{ borderBottom: "none", borderTop: "none" }}>
                  <span style={{ fontWeight: "bold" }}>(2)</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <LocoCell row={3} loco={4} players={getPlayers(3, 4)} />
                <LocoCell row={3} loco={5} players={getPlayers(3, 5)} />
                <LocoCell row={3} loco={6} players={getPlayers(3, 6)} />
                <TableCell style={{ borderBottom: "none", borderTop: "none" }}>
                  <span style={{ fontWeight: "bold" }}>(2)</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <EmptyCell />
                <EmptyCell />
                <LocoCell row={2} loco={3} players={getPlayers(2, 3)} />
                <LocoCell row={2} loco={4} players={getPlayers(2, 4)} />
                <LocoCell row={2} loco={5} players={getPlayers(2, 5)} />
                <EmptyCell />
                <TableCell style={{ borderBottom: "none", borderTop: "none" }}>
                  <span style={{ fontWeight: "bold" }}>(1)</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <LocoCell row={1} loco={1} players={getPlayers(1, 1)} />
                <LocoCell row={1} loco={2} players={getPlayers(1, 2)} />
                <LocoCell row={1} loco={3} players={getPlayers(1, 3)} />
                <LocoCell row={1} loco={4} players={getPlayers(1, 4)} />
                <EmptyCell />
                <EmptyCell />
                <TableCell style={{ borderBottom: "none", borderTop: "none" }}>
                  <span style={{ fontWeight: "bold" }}>(1)</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <LocoCell row={0} loco={1} players={getPlayers(0, 1)} />
                <LocoCell row={0} loco={2} players={getPlayers(0, 2)} />
                <LocoCell row={0} loco={3} players={getPlayers(0, 3)} />
                <EmptyCell />
                <EmptyCell />
                <EmptyCell />
                <TableCell style={{ borderBottom: "none", borderTop: "none" }}>
                  <span style={{ fontWeight: "bold" }}>(0)</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

function EmptyCell() {
  return <TableCell style={{ background: "none", border: "none" }} />;
}

function LocoCell({
  row,
  loco,
  players,
}: {
  row: number;
  loco: number;
  players: PlayerColor[];
}) {
  let backgroundColor: string | undefined;
  switch (row) {
    case 1:
      backgroundColor = "#ebf4fc";
      break;
    case 2:
      backgroundColor = "#ebf4fc";
      break;
    case 3:
      backgroundColor = "#eef7ee";
      break;
    case 4:
      backgroundColor = "#eef7ee";
      break;
  }

  return (
    <TableCell style={{ backgroundColor: backgroundColor }}>
      {loco}
      {players.map((color) => (
        <PlayerBlock key={color} color={color} />
      ))}
    </TableCell>
  );
}

function PlayerBlock({ color }: { color: PlayerColor }) {
  return (
    <div className={`${styles.playerBlock} ${getPlayerColorCss(color)}`} />
  );
}
