import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GameHistoryApi } from "../../api/history";
import { isGameHistory, useGame } from "../services/game";
import {Button} from "semantic-ui-react";

export function HistorySelector() {
  const game = useGame();
  if (!isGameHistory(game)) {
    return <></>;
  }
  return <InternalHistorySelector history={game} />;
}

function InternalHistorySelector({ history }: { history: GameHistoryApi }) {
  const navigate = useNavigate();
  const next = useCallback(() => {
    navigate(`/app/games/${history.id}/histories/${history.historyId + 1}`);
  }, [history.id, history.historyId]);
  const prev = useCallback(() => {
    navigate(`/app/games/${history.id}/histories/${history.historyId - 1}`);
  }, [history.id, history.historyId]);
  return (
    <div>
      <h3>History</h3>
      {history.next.length && <Button onClick={next}>Next</Button>}
      {history.previous && <Button onClick={prev}>Previous</Button>}
      <ul>
        {history.next.map((next) => (
          <li key={next.historyId}>{next.actionName}</li>
        ))}
      </ul>
    </div>
  );
}
