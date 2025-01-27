import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { GameLiteApi, GameStatus, gameStatusToString } from "../../api/game";
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
      <CardHeader
        title={game.name}
        className={`${gameStatusToStyle(game.status)} ${game.activePlayerId === me?.id ? styles.activePlayer : ""}`}
        subheader={hideStatus ? "" : `${gameStatusToString(game)}`}
      />
      <CardContent>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Game: {ViewRegistry.singleton.get(game.gameKey)!.name}
        </Typography>
        {game.activePlayerId && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Active Player: <Username userId={game.activePlayerId} />
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Players: <UsernameList userIds={game.playerIds} />
        </Typography>
        {game.status === GameStatus.enum.LOBBY && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Seats: {seats(game)}
          </Typography>
        )}
        {variantString != null && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Variants: {variantString.join(", ")}
          </Typography>
        )}
        {game.unlisted && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontStyle: "italic" }}
          >
            Unlisted
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <ViewButton game={game} />
        <LeaveButton game={game} />
        <JoinButton game={game} />
        <StartButton game={game} />
        <DeleteButton game={game} />
      </CardActions>
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

export function ViewButton({ game }: GameButtonProps) {
  if (
    game.status !== GameStatus.enum.ACTIVE &&
    game.status !== GameStatus.enum.ENDED
  )
    return <></>;

  return (
    <Button component={Link} to={`/app/games/${game.id}`}>
      View
    </Button>
  );
}

export function LeaveButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useLeaveGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button disabled={isPending} onClick={perform}>
      Leave
    </Button>
  );
}

export function JoinButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useJoinGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button disabled={isPending} onClick={perform}>
      Join
    </Button>
  );
}

export function StartButton({ game }: GameButtonProps) {
  const { canPerform, perform, isPending } = useStartGame(game);
  if (!canPerform) {
    return <></>;
  }

  return (
    <Button disabled={isPending} onClick={perform}>
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
    <Button disabled={isPending} onClick={perform}>
      Delete
    </Button>
  );
}
