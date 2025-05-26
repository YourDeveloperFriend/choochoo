import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Button,
  Menu,
  MenuItem,
} from "semantic-ui-react";
import { GameStatus } from "../../api/game";
import { UsernameList } from "../components/username";
import { useAbandon, useConcede, useGame, useKick } from "../services/game";
import { useMe } from "../services/me";
import * as styles from "./options.module.css";
import { useState } from "react";

export function GameOptions() {
  const game = useGame();
  const me = useMe();
  const { concede, hasConceded, isPending: isConcedePending } = useConcede();
  const { abandon, isPending: isAbandonPending } = useAbandon();
  const { kick, isPending: isKickPending, kickTimeRemaining } = useKick();
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
                Abandoning the game causes the game to end in an abandoned
                state, and it will hurt your reputation to do so.
              </p>
            </div>
            <div className={styles.row}>
              <div className={styles.buttonContainer}>
                <Button
                  onClick={kick}
                  disabled={kickTimeRemaining != null || isKickPending}
                >
                  Kick current player
                </Button>
              </div>
              {kickTimeRemaining == null ? (
                <p>
                  You can kick the current player because they took too long to
                  play. This will end the game in an abandoned state, and hurt
                  the reputation of the player being kicked.
                </p>
              ) : (
                <p>
                  The current player has {kickTimeRemaining} remaining. Once
                  that time is up, you can kick the current player. This will
                  end the game in an abandoned state and hurt the reputation of
                  the current player.
                </p>
              )}
            </div>
          </div>
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}
