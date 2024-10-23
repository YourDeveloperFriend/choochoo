import { useEffect, useState } from "react";
import { MessageApi } from "../../api/message";
import { assert } from "../../utils/validate";
import { messageClient } from "../services/message";
import * as styles from "./game_log.module.css";


interface GameLogProps {
  gameId?: string;
}

export function GameLog({ gameId }: GameLogProps) {
  const [logsGameId, setLogsGameId] = useState<string | undefined>(undefined);
  const [logsState, setLogs] = useState<MessageApi[] | undefined>(undefined);

  useEffect(() => {
    let setLogsInternal = (messages: MessageApi[]) => {
      setLogsGameId(gameId);
      setLogs(messages);
    };
    messageClient.list({ query: { gameId } }).then(({ status, body }) => {
      assert(status === 200);
      setLogsInternal(body.messages.reverse());
    });
    return () => {
      setLogsInternal = () => { };
    };
  }, [gameId]);

  const logs = logsGameId === gameId ? logsState : [];

  return <div className={styles['log-container']}>
    {logs?.map((log) =>
      <p key={log.id}>[{log.date}] {log.userId ?? 'System'}: {log.message}</p>
    )}
  </div>;
}