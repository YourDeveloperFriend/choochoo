import { FormEvent, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
// @ts-ignore-next
import useStayScrolled from 'react-stay-scrolled';
import { isNotNull } from "../../utils/functions";
import { useMessages, useSendChat } from "../services/socket";
import { useUsers } from "../services/user";
import { useTextInputState } from "../utils/form_state";
import * as styles from "./game_log.module.css";


interface GameLogProps {
  gameId?: number;
}

export function GameLog({ gameId }: GameLogProps) {
  const { messages, isLoading, fetchNextPage, hasNextPage } = useMessages(gameId);
  const ref = useRef<HTMLDivElement | null>(null);
  const [canScrollToBottom, setCanScrollToBottom] = useState(false);
  const [newMessage, setNewMessage, setNewMessageRaw] = useTextInputState('');
  const { sendChat, isPending } = useSendChat(gameId);

  const users = useUsers(messages.map((log) => log.userId).filter(isNotNull));

  const usernames = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.username]));
  }, [users]);

  const { stayScrolled, isScrolled, scrollBottom } = useStayScrolled(ref);

  const onScroll = useCallback(() => {
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom]);

  useLayoutEffect(() => {
    // Tell the user to scroll down to see the newest messages if the element wasn't scrolled down
    stayScrolled();
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom, messages.length]);

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendChat(newMessage, () => setNewMessageRaw(''));
  }, [newMessage]);

  return <div>
    <div className={styles['log-container']}>
      <div className={styles['log-list']} ref={ref} onScroll={onScroll}>
        {hasNextPage && <button onClick={fetchNextPage} disabled={isLoading} style={{ width: '100%', textAlign: 'center' }}>Load More</button>}
        {messages.map((log) =>
          <p key={log.id}>[{log.date}] {log.userId != null ? usernames.get(log.userId) : 'System'}: {log.message}</p>
        )}
      </div>
      {canScrollToBottom && <div className={styles['notify-new-container']}>
        <button className={styles['notify-new']} onClick={scrollBottom}>Scroll to bottom</button>
      </div>}
    </div>
    <form onSubmit={onSubmit} className={styles['submit-form']}>
      <input type="text" maxLength={256} value={newMessage} onChange={setNewMessage} disabled={isPending} />
      <input type="submit" value="Send" disabled={isPending} />
    </form>
  </div>;
}