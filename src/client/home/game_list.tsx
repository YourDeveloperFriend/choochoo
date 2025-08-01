import { useMemo } from "react";
import { Button, CardGroup, Icon } from "semantic-ui-react";
import { GameLiteApi, GameStatus, ListGamesApi } from "../../api/game";
import { partition } from "../../utils/functions";
import { useGameList } from "../services/game";
import { useMe } from "../services/me";
import { GameCard } from "./game_card";
import * as styles from "./game_list.module.css";

interface GameListProps {
  query: ListGamesApi;
  title: string;
  hideStatus?: boolean;
  fixOrder?: boolean;
}

export function GameList({
  query,
  title,
  hideStatus,
  fixOrder,
}: GameListProps) {
  const me = useMe();
  const { games, nextPage, prevPage, hasPrevPage, hasNextPage } =
    useGameList(query);

  const gamesInOrder: GameLiteApi[] = useMemo(() => {
    if (games == null) return [];
    if (!fixOrder) return games;
    const myActiveGames = partition(
      games,
      (game) => me != null && game.activePlayerId === me.id,
    );
    const statuses = partition(
      myActiveGames.get(false) ?? [],
      (game) => game.status,
    );
    return [
      ...(myActiveGames.get(true) ?? []),
      ...(statuses.get(GameStatus.enum.ACTIVE) ?? ([] as GameLiteApi[])),
      ...(statuses.get(GameStatus.enum.LOBBY) ?? ([] as GameLiteApi[])),
    ];
  }, [games, fixOrder, me]);

  if (games == null || games.length === 0) return <></>;

  return (
    <div className={styles.gameListCard}>
      <h2>{title}</h2>

      <CardGroup stackable>
        {gamesInOrder.map((game) => (
          <GameCard game={game} key={game.id} hideStatus={hideStatus} />
        ))}
      </CardGroup>
      <div style={{ marginTop: "1em" }}>
        {hasPrevPage && (
          <Button secondary onClick={prevPage}>
            <Icon name="angle left" />
            Prev
          </Button>
        )}
        {hasNextPage && (
          <Button secondary onClick={nextPage} disabled={games == null}>
            Next
            <Icon name="angle right" />
          </Button>
        )}
      </div>
    </div>
  );
}
