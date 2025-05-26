import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMeta, Icon,
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import {
  GameLiteApi,
  GameStatus,
  gameStatusToString,
  turnDurationToString,
} from "../../api/game";
import { ViewRegistry } from "../../maps/view_registry";
import { assertNever } from "../../utils/validate";
import { useAwaitingPlayer } from "../components/awaiting_player";
import { Username, UsernameList } from "../components/username";
import {
  useDeleteGame,
  useJoinGame,
  useLeaveGame,
  useStartGame,
} from "../services/game";
import { useMe } from "../services/me";
import * as styles from "./game_card.module.css";

interface GameCardProps {
  game: GameLiteApi;
  hideStatus?: boolean;
}

export function GameCard({ game, hideStatus }: GameCardProps) {
  const me = useMe();

  useAwaitingPlayer(game.activePlayerId);

  const variantString = ViewRegistry.singleton
    .get(game.gameKey)
    .getVariantString?.(game.variant);

  return (
    <Card className={styles.gameCard}>
      <CardContent style={{ padding: "0" }}>
        <CardHeader
          className={`${styles.gameCardHeader} ${gameStatusToStyle(game.status)} ${game.activePlayerId === me?.id ? styles.activePlayer : ""}`}
        >
          {game.name}
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
            <p>Turn Length: {turnDurationToString(game.turnDuration)}</p>
            {variantString != null && (
              <p>Variants: {variantString.join(", ")}</p>
            )}
            {game.unlisted && <p style={{ fontStyle: "italic" }}>Unlisted</p>}
          </div>
        </CardDescription>
      </CardContent>
      <CardContent extra>
        <ViewButton game={game} />
        <LeaveButton game={game} />
        <JoinButton game={game} />
        <StartButton game={game} />
        <DeleteButton game={game} />
      </CardContent>
    </Card>
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
    case GameStatus.enum.ABANDONED:
      return styles.abandoned;
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
  if (
    game.status !== GameStatus.enum.ACTIVE &&
    game.status !== GameStatus.enum.ENDED
  )
    return <></>;

  return (
    <Button color="green" as={Link} to={`/app/games/${game.id}`}>
      View
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

function JoinButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useJoinGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button primary disabled={isPending} onClick={perform}>
      Join
    </Button>
  );
}

function StartButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useStartGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button primary disabled={isPending} onClick={perform}>
      Start
    </Button>
  );
}

export function DeleteButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useDeleteGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button icon labelPosition="left" negative disabled={isPending} onClick={perform}>
      <Icon name="delete" />
      Delete
    </Button>
  );
}
