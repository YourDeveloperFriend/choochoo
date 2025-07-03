import { GameStatus } from "../../api/game";
import { assertNever } from "../../utils/validate";
import { GameCard } from "../home/game_card";
import { PartialActionProvider } from "../services/action";
import { useGame } from "../services/game";
import { ActiveGame } from "./active_game";
import { MapGridPreview, MapInfo } from "./map_info";
import { Container, Segment } from "semantic-ui-react";
import * as React from "react";

export function GamePage() {
  const game = useGame();

  switch (game.status) {
    case GameStatus.enum.LOBBY:
      return (
        <Container>
          <GameCard game={game} />
          <Segment>
            <MapInfo gameKey={game.gameKey} variant={game.variant} />
            <MapGridPreview gameKey={game.gameKey} />
          </Segment>
        </Container>
      );
    case GameStatus.enum.ACTIVE:
    case GameStatus.enum.ENDED:
    case GameStatus.enum.ABANDONED:
      return (
        <PartialActionProvider>
          <ActiveGame />
        </PartialActionProvider>
      );
    default:
      assertNever(game.status);
  }
}
