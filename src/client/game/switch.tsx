import { useGame } from "../services/game";
import { useCurrentPlayer } from "../utils/injection_context";
import { LoginButton } from "./login_button";

export function SwitchToUndo() {
  const game = useGame();
  if (game.undoPlayerId == null) {
    return <></>;
  }
  return (
    <LoginButton playerId={game.undoPlayerId}>Switch to undo user</LoginButton>
  );
}

export function SwitchToActive() {
  const currentPlayer = useCurrentPlayer();
  if (currentPlayer == null) {
    return <></>;
  }
  return (
    <LoginButton playerId={currentPlayer.playerId}>
      Switch to active user
    </LoginButton>
  );
}
