import { GameStatus } from "../../api/game";
import { assertNever } from "../../utils/validate";
import { GameCard } from "../home/game_card";
import { useGame } from "../services/game";
import { ActiveGame } from "./active_game";

export function GamePage() {
  const game = useGame();

  switch (game.status) {
    case GameStatus.enum.LOBBY:
      return <GameCard game={game} />;
    case GameStatus.enum.ACTIVE:
    case GameStatus.enum.ENDED:
    case GameStatus.enum.ABANDONED:
      return <ActiveGame />;
    default:
      assertNever(game.status);
  }
}
