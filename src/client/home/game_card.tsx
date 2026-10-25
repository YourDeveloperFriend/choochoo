import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMeta,
  Confirm,
  Icon,
  Popup,
} from "semantic-ui-react";
import {
  activeHoursToString,
  GameLiteApi,
  GameStatus,
  gameStatusToString,
  TurnDuration,
  turnDurationToString,
} from "../../api/game";
import { ViewRegistry } from "../../maps/view_registry";
import { assertNever } from "../../utils/validate";
import { Username, UsernameList } from "../components/username";
import {
  useDeleteGame,
  useJoinGame,
  useLeaveGame,
  useSetUnlisted,
  useStartGame,
} from "../services/game";
import { useMe } from "../services/me";
import { emitSuccess } from "../utils/notify";
import * as styles from "./game_card.module.css";

interface GameCardProps {
  game: GameLiteApi;
  hideStatus?: boolean;
}

export function GameCard({ game, hideStatus }: GameCardProps) {
  const me = useMe();

  const variantString = ViewRegistry.singleton
    .get(game.gameKey)
    .getVariantString?.(game.variant);

  return (
    <Card className={styles.gameCard} data-game-card>
      <CardContent style={{ padding: "0" }}>
        <CardHeader
          className={`${styles.gameCardHeader} ${gameStatusToStyle(game.status)} ${game.activePlayerId === me?.id ? styles.activePlayer : ""}`}
        >
          {game.name}
          {game.status === GameStatus.enum.LOBBY && game.minKarma > 0 && (
            <MinKarma minKarma={game.minKarma} />
          )}
          <CardMeta
            className={styles.gameCardMeta}
            content={hideStatus ? "" : `${gameStatusToString(game)}`}
          />
        </CardHeader>
      </CardContent>
      <CardContent style={{ borderTop: "none" }}>
        <CardDescription>
          <div className={styles.gameCardText}>
            <p>Game: {ViewRegistry.singleton.get(game.gameKey)!.name}</p>
            {game.activePlayerId && (
              <p>
                Active Player:{" "}
                <Username userId={game.activePlayerId} useLink={true} />
              </p>
            )}
            <p>
              Players: <UsernameList userIds={game.playerIds} useLink={true} />
            </p>
            {game.status === GameStatus.enum.LOBBY && (
              <p>Seats: {seats(game)}</p>
            )}
            <p>
              Turn Length: {turnDurationToString(game.turnDuration)}
              {game.turnDuration < TurnDuration.ONE_DAY && (
                <>
                  ,{" "}
                  {activeHoursToString(
                    game.gameHoursStart,
                    game.gameHoursDuration,
                  )}
                </>
              )}
            </p>
            {variantString != null && (
              <p>Variants: {variantString.join(", ")}</p>
            )}
            {game.unlisted && <p style={{ fontStyle: "italic" }}>Unlisted</p>}
          </div>
        </CardDescription>
      </CardContent>
      <CardContent extra>
        <div className={styles.gameCardActions}>
          <div className={styles.primaryActions}>
            <ViewButton game={game} />
            <JoinButton game={game} />
            <StartButton game={game} />
            <LeaveButton game={game} />
          </div>
          <div className={styles.secondaryActions}>
            {game.status === GameStatus.enum.LOBBY && (
              <InviteButton game={game} />
            )}
            <ListingButton game={game} />
            <DeleteButton game={game} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MinKarma({ minKarma }: { minKarma: number }) {
  const me = useMe();
  const insufficient = me != null && me.karma < minKarma;
  return (
    <Popup
      position="top right"
      trigger={
        <span
          className={`${styles.minKarma} ${insufficient ? styles.minKarmaWarning : ""}`}
          data-min-karma
        >
          <Icon name={insufficient ? "warning sign" : "balance scale"} />
          {minKarma}
        </span>
      }
      content={
        insufficient
          ? `Minimum karma needed to join this table: ${minKarma}. You don't have the minimum karma required to join this table (yours: ${me.karma}).`
          : `Minimum karma needed to join this table: ${minKarma}.`
      }
    />
  );
}

function seats(game: GameLiteApi): string {
  const { minPlayers, maxPlayers } = game.config;
  return minPlayers === maxPlayers
    ? `${minPlayers}`
    : `${minPlayers}-${maxPlayers}`;
}

function gameStatusToStyle(status: GameStatus): string {
  switch (status) {
    case GameStatus.enum.LOBBY:
      return styles.lobby;
    case GameStatus.enum.ENDED:
      return styles.ended;
    case GameStatus.enum.ACTIVE:
      return styles.active;
    default:
      assertNever(status);
  }
}

interface GameButtonProps {
  game: GameLiteApi;
}

function ViewButton({ game }: GameButtonProps) {
  return (
    <Button color="green" as={Link} to={`/app/games/${game.id}`}>
      View
    </Button>
  );
}

function InviteButton({ game }: GameButtonProps) {
  const copyInviteLink = useCallback(() => {
    const url = `${window.location.origin}/app/games/${game.id}`;
    navigator.clipboard.writeText(url).then(() => {
      emitSuccess("Invite link copied to clipboard!");
    });
  }, [game.id]);

  return (
    <Button
      icon
      basic
      size="small"
      labelPosition="left"
      onClick={copyInviteLink}
    >
      <Icon name="copy" />
      Invite
    </Button>
  );
}

function LeaveButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useLeaveGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button negative disabled={isPending} onClick={perform}>
      Leave
    </Button>
  );
}

function hasUnusualActiveHours(game: GameLiteApi): boolean {
  if (game.turnDuration >= TurnDuration.ONE_DAY) return false;
  if (game.gameHoursDuration >= 24) return true;
  const offsetMinutes = new Date().getTimezoneOffset();
  const localStart =
    (((game.gameHoursStart - Math.round(offsetMinutes / 60)) % 24) + 24) % 24;
  const localEnd = (localStart + game.gameHoursDuration) % 24;
  return localEnd < localStart || localStart < 6;
}

function JoinButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useJoinGame(game);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!canPerform) {
    return <></>;
  }

  const needsConfirmation = hasUnusualActiveHours(game);

  const handleClick = () => {
    if (needsConfirmation) {
      setConfirmOpen(true);
    } else {
      perform();
    }
  };

  return (
    <>
      <Button
        primary
        disabled={isPending}
        onClick={handleClick}
        data-join-button
      >
        Join
      </Button>
      <Confirm
        open={confirmOpen}
        header="Different Time Zone?"
        content={`This game's active hours (${activeHoursToString(game.gameHoursStart, game.gameHoursDuration)}) may have been set for a different time zone. Make sure you can take turns during these hours before joining.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          perform();
        }}
      />
    </>
  );
}

function ListingButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useSetUnlisted(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button
      icon
      basic
      size="small"
      labelPosition="left"
      color={game.unlisted ? "green" : "orange"}
      disabled={isPending}
      onClick={perform}
    >
      <Icon name={game.unlisted ? "eye" : "eye slash"} />
      {game.unlisted ? "Make Public" : "Make Unlisted"}
    </Button>
  );
}

function StartButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useStartGame(game);
  const seedRef = useRef<HTMLInputElement | null>(null);

  const startGame = useCallback(() => {
    perform(seedRef.current?.value !== "" ? seedRef.current?.value : undefined);
  }, [perform, seedRef]);

  if (!canPerform) {
    return <></>;
  }

  return (
    <>
      <input type="hidden" name="seed" ref={seedRef} />
      <Button
        primary
        disabled={isPending}
        onClick={startGame}
        data-start-button
      >
        Start
      </Button>
    </>
  );
}

export function DeleteButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useDeleteGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button
      icon
      basic
      negative
      size="small"
      labelPosition="left"
      disabled={isPending}
      onClick={perform}
    >
      <Icon name="trash" />
      Delete
    </Button>
  );
}
