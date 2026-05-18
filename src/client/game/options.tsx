import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Button,
  Header,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { GameStatus } from "../../api/game";
import { Username, UsernameList } from "../components/username";
import { useAbandon, useConcede, useGame, useKick } from "../services/game";
import { useMe } from "../services/me";
import * as styles from "./options.module.css";
import { useState } from "react";
import { GameNotesButton } from "./game_notes";
import { playerFlexRemaining } from "../../utils/active_time";
import { formatMillisecondDuration } from "../../utils/functions";

function FlexTimeTable() {
  const game = useGame();
  const now = new Date();

  return (
    <div>
      <Header as="h2">Flex Time Remaining</Header>
      <Table compact size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Player</TableHeaderCell>
            <TableHeaderCell>Flex Time Remaining</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {game.playerIds.map((playerId) => (
            <TableRow key={playerId}>
              <TableCell>
                <Username userId={playerId} />
              </TableCell>
              <TableCell>
                {formatMillisecondDuration(
                  playerFlexRemaining(game, playerId, now),
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function GameOptions() {
  const game = useGame();
  const me = useMe();
  const { concede, hasConceded, isPending: isConcedePending } = useConcede();
  const { abandon, isPending: isAbandonPending } = useAbandon();
  const {
    kick,
    isPending: isKickPending,
    kickTimeRemaining,
    kickFlexTimeRemaining,
  } = useKick();
  const [expanded, setExpanded] = useState<boolean>(false);

  if (
    game.status !== GameStatus.enum.ACTIVE ||
    me == null ||
    !game.playerIds.includes(me.id)
  ) {
    return <></>;
  }

  return (
    <Accordion as={Menu} fluid vertical>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Game Options"
        />
        <AccordionContent active={expanded}>
          <div className={styles.container}>
            <div className={styles.row}>
              <div className={styles.buttonContainer}>
                <Button onClick={concede} disabled={isConcedePending}>
                  {hasConceded ? "Undo concede" : "Concede"}
                </Button>
              </div>
              <p>
                If everyone agrees to concede a game, it&apos;ll end with the
                current lead player winning the game. This does not hurt
                anyone&apos;s reputation.
                {game.concedingPlayers.length !== 0 && (
                  <>
                    {" "}
                    Conceding Players:{" "}
                    <UsernameList userIds={game.concedingPlayers} />
                  </>
                )}
              </p>
            </div>
            <div className={styles.row}>
              <div className={styles.buttonContainer}>
                <Button onClick={abandon} disabled={isAbandonPending}>
                  Abandon game
                </Button>
              </div>
              <p>
                {game.degenerate
                  ? "Abandoning the game will eliminate you from play. Since this game is already in a degenerate state, your reputation will not be affected."
                  : "Abandoning the game will eliminate you from play, and it will hurt your reputation to do so."}
              </p>
            </div>
            <div className={styles.row}>
              <div className={styles.buttonContainer}>
                <Button
                  onClick={kick}
                  disabled={
                    kickTimeRemaining != null ||
                    kickFlexTimeRemaining != null ||
                    isKickPending
                  }
                >
                  Kick current player
                </Button>
              </div>
              {kickTimeRemaining != null ? (
                <p>
                  The current player has {kickTimeRemaining} of turn time
                  remaining. Once that expires, their flex time will be used.
                </p>
              ) : kickFlexTimeRemaining != null ? (
                <p>
                  The current player is using flex time: {kickFlexTimeRemaining}{" "}
                  remaining. Once that expires, you can kick them.
                </p>
              ) : (
                <p>
                  You can kick the current player because they took too long to
                  play. This will eliminate them from the game and hurt their
                  reputation.
                </p>
              )}
            </div>
            <div className={styles.row}>
              <div className={styles.buttonContainer}>
                <GameNotesButton />
              </div>
              <p>Add notes for yourself for when you return to this game.</p>
            </div>
            <FlexTimeTable />
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
