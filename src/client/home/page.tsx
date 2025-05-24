import {useMemo} from "react";
import {Link} from "react-router-dom";
import {Button, Header} from "semantic-ui-react";
import {GameStatus, ListGamesApi} from "../../api/game";
import {ChatLog} from "../game/game_log";
import {useMe} from "../services/me";
import {GameList} from "./game_list";

export function HomePage() {
  const user = useMe();

  const userQuery: ListGamesApi = useMemo(
    () => ({
      status: [GameStatus.Enum.LOBBY, GameStatus.Enum.ACTIVE],
      userId: user?.id,
      order: ["id", "DESC"],
    }),
    [user],
  );

  const lobbyQuery: ListGamesApi = useMemo(
    () => ({
      status: [GameStatus.Enum.LOBBY],
      excludeUserId: user?.id,
      order: ["id", "DESC"],
    }),
    [user],
  );

  const activeQuery: ListGamesApi = useMemo(
    () => ({
      status: [GameStatus.Enum.ACTIVE],
      excludeUserId: user?.id,
      order: ["updatedAt", "DESC"],
    }),
    [user],
  );

  const endedQuery: ListGamesApi = useMemo(
    () => ({
      status: [GameStatus.Enum.ENDED],
      order: ["updatedAt", "DESC"],
    }),
    [user],
  );

  return (
    <div>
      <Header as="h1">Choo Choo Games</Header>
      <ChatLog />
      <div style={{marginTop: "1em", marginBottom: "1em"}}>
        <Button as={Link} primary to="/app/games/create" variant="contained">
          Create Game
        </Button>
      </div>
      {user && <GameList title="Your Games" query={userQuery} fixOrder />}
      <GameList title="New Games" query={lobbyQuery} />
      <GameList title="Active Games" query={activeQuery} />
      <GameList title="Ended Games" query={endedQuery} hideStatus />
    </div>
  );
}
