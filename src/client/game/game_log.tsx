import {
  FormEvent,
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { timeFormat } from "../../utils/functions";
import { useMessages, useSendChat } from "../services/message";
import { useTextInputState } from "../utils/form_state";
import * as styles from "./game_log.module.css";

// @ts-expect-error This doesn't inject properly.
import useStayScrolled from "react-stay-scrolled";
import { GameHistoryApi } from "../../api/history";
import { MessageApi } from "../../api/message";
import { Username } from "../components/username";
import { isGameHistory, useGame } from "../services/game";
import { Button, Form, Icon, Input, Popup } from "semantic-ui-react";

export function GameLog() {
  const game = useGame();
  if (isGameHistory(game)) {
    return <GameHistoryLog history={game} />;
  }
  return <ChatLog gameId={game.id} />;
}

function GameHistoryLog({ history }: { history: GameHistoryApi }) {
  return <LogMessages messages={history.logs} />;
}

interface ChatLogProps {
  gameId?: number;
}

export function ChatLog({ gameId }: ChatLogProps) {
  const { messages, isLoading, fetchNextPage, hasNextPage } =
    useMessages(gameId);
  const [newMessage, setNewMessage, setNewMessageRaw] = useTextInputState("");
  const { sendChat, isPending } = useSendChat(gameId);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      sendChat(newMessage, () => setNewMessageRaw(""));
    },
    [newMessage],
  );

  return (
    <div className={styles.chat}>
      <LogMessages
        messages={messages}
        fetchNextPage={hasNextPage ? fetchNextPage : undefined}
        disableNextPage={isLoading}
      />
      <Form onSubmit={onSubmit} className={styles.submitForm}>
        <Input
          fluid
          className={styles.submitInput}
          type="text"
          maxLength={255}
          placeholder="Send message"
          value={newMessage}
          onChange={setNewMessage}
          disabled={isPending}
        />
        <Button
          primary
          style={{ marginLeft: "1em" }}
          size="mini"
          type="submit"
          disabled={isPending}
        >
          Send
        </Button>
      </Form>
    </div>
  );
}

const MESSAGE_PARSER = /<@user-(\d+)>/g;

function LogMessage({ message }: { message: string }) {
  const messageParsed = useMemo(() => {
    const parts: Array<string | number> = [];
    let lastIndex = 0;
    for (const match of message.matchAll(MESSAGE_PARSER)) {
      parts.push(message.substring(lastIndex, match.index));
      parts.push(Number(match[1]));
      lastIndex = match.index + match[0].length;
    }
    parts.push(message.substring(lastIndex));
    return parts;
  }, [message]);

  return (
    <>
      {messageParsed.map((part, index) => (
        <span key={index}>
          {typeof part === "string" ? (
            part
          ) : (
            <Username userId={part} useAt={true} useLink={true} />
          )}
        </span>
      ))}
    </>
  );
}

interface LogMessagesProps {
  messages: MessageApi[];
  fetchNextPage?: () => void;
  disableNextPage?: boolean;
}

function LogMessages({
  messages,
  fetchNextPage,
  disableNextPage,
}: LogMessagesProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [canScrollToBottom, setCanScrollToBottom] = useState(false);
  const { stayScrolled, isScrolled, scrollBottom } = useStayScrolled(ref);

  const onScroll = useCallback(() => {
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom]);

  useLayoutEffect(() => {
    // Tell the user to scroll down to see the newest messages if the element wasn't scrolled down
    stayScrolled();
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom, messages.length]);

  return (
    <div className={styles.logContainer}>
      <div className={styles.logList} ref={ref} onScroll={onScroll}>
        {fetchNextPage != null && (
          <button
            onClick={fetchNextPage}
            disabled={disableNextPage}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        )}
        {messages.map((log, index) => {
          const dateString = log.date.toLocaleDateString();
          const isNewDay =
            index == 0 ||
            dateString !== messages[index - 1].date.toLocaleDateString();
          return (
            <Fragment key={log.id}>
              {isNewDay && <p>-- {dateString} --</p>}
              <p className={styles.logLine}>
                <span className={styles.time}>{timeFormat(log.date)}</span>{" "}
                {log.userId != null && (
                  <>
                    <span className={styles.username}>
                      <Username userId={log.userId} useLink={true} />
                    </span>
                    :
                  </>
                )}{" "}
                <span>
                  <LogMessage message={log.message} />
                </span>
              </p>
            </Fragment>
          );
        })}
      </div>
      {canScrollToBottom && (
        <div className={styles.scrollToBottomContainer}>
          <Popup
            content="Scroll to bottom"
            trigger={
              <Button primary size="small" icon circular onClick={scrollBottom}>
                <Icon name="arrow down" />
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
