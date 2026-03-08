import {
  FormEvent,
  Fragment,
  MouseEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { timeFormat } from "../../utils/functions";
import {
  MessageType,
  containsMentionOfUser,
  detectMessageType,
  getMessageActor,
} from "../../utils/message_types";
import { injectAllPlayersUnsafe } from "../../engine/game/state";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { useMessages, useSendChat } from "../services/message";
import { useMe } from "../services/me";
import { useLocalStorage } from "../services/local_storage";
import { useTextInputState } from "../utils/form_state";
import { useInject } from "../utils/injection_context";
import { FilterControls } from "./filter_controls";
import * as styles from "./game_log.module.css";

// @ts-expect-error This doesn't inject properly.
import useStayScrolled from "react-stay-scrolled";
import { Button, Form, Icon, Input, Popup } from "semantic-ui-react";
import { GameHistoryApi } from "../../api/history";
import { MessageApi } from "../../api/message";
import { getPlayerColorCss } from "../components/player_color";
import { Username } from "../components/username";
import { isGameHistory, useGame } from "../services/game";

export function GameLog() {
  const game = useGame();
  const userColorLookup = useInject(() => {
    const lookup: Record<number, PlayerColor> = {};
    injectAllPlayersUnsafe()().forEach((player) => {
      lookup[player.playerId] = player.color;
    });
    return lookup;
  }, [game.id]);

  if (isGameHistory(game)) {
    return <GameHistoryLog history={game} userColorLookup={userColorLookup} />;
  }
  return <ChatLog gameId={game.id} userColorLookup={userColorLookup} />;
}

function GameHistoryLog({
  history,
  userColorLookup,
}: {
  history: GameHistoryApi;
  userColorLookup: Record<number, PlayerColor>;
}) {
  const me = useMe();
  return (
    <LogMessages
      messages={history.logs}
      currentUserId={me?.id}
      userColorLookup={userColorLookup}
    />
  );
}

interface ChatLogProps {
  gameId?: number;
  userColorLookup?: Record<number, PlayerColor>;
  showFilters?: boolean;
}

export function ChatLog({ gameId, userColorLookup = {}, showFilters = true }: ChatLogProps) {
  const { messages, isLoading, fetchNextPage, hasNextPage } =
    useMessages(gameId);
  const [newMessage, setNewMessage, setNewMessageRaw] = useTextInputState("");
  const { sendChat, isPending } = useSendChat(gameId);
  const me = useMe();

  // Filter state with localStorage persistence
  const [storedFilters, setStoredFilters] = useLocalStorage<MessageType[]>(
    `chat-filters-${gameId ?? 'home'}`,
  );
  const [activeFilters, setActiveFilters] = useState<Set<MessageType>>(() => {
    if (storedFilters && storedFilters.length > 0) {
      return new Set(storedFilters);
    }
    // Default: no filters active (show all)
    return new Set();
  });

  // Reset filters when gameId changes to prevent stale state
  useLayoutEffect(() => {
    setActiveFilters(new Set());
  }, [gameId]);

  // Toggle filter handler
  const handleToggleFilter = useCallback(
    (type: MessageType) => {
      setActiveFilters((prev) => {
        const next = new Set(prev);
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
        // Persist to localStorage
        setStoredFilters(Array.from(next));
        return next;
      });
    },
    [setStoredFilters],
  );

  // Filter messages by active types
  // If no filters are active, show all messages
  // If showFilters is false, always show all messages (bypass filtering)
  const filteredMessages = useMemo(
    () => {
      if (!showFilters || activeFilters.size === 0) {
        return messages;
      }
      return messages.filter((message) => {
        const type = detectMessageType(message);
        return activeFilters.has(type);
      });
    },
    [messages, activeFilters, showFilters],
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      sendChat(newMessage, () => setNewMessageRaw(""));
    },
    [newMessage, sendChat, setNewMessageRaw],
  );

  return (
    <div className={styles.chat}>
      {showFilters && (
        <FilterControls
          activeFilters={activeFilters}
          onToggle={handleToggleFilter}
        />
      )}
      <LogMessages
        messages={filteredMessages}
        allMessages={messages}
        fetchNextPage={hasNextPage ? fetchNextPage : undefined}
        disableNextPage={isLoading}
        currentUserId={me?.id}
        userColorLookup={userColorLookup}
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

const USER_MESSAGE_PARSER = /<@(user|game)-(\d+)>/g;
const PLAYER_COLOR_PARSER = /\((red|yellow|green|purple|black|blue|brown|white|pink)\)/gi;
const ACTOR_PREFIX_PARSER = /^\s*<@user-(\d+)>\s*(?:\([^)]+\))?/;

const PLAYER_COLOR_LOOKUP: Record<string, PlayerColor> = {
  red: PlayerColor.RED,
  yellow: PlayerColor.YELLOW,
  green: PlayerColor.GREEN,
  purple: PlayerColor.PURPLE,
  black: PlayerColor.BLACK,
  blue: PlayerColor.BLUE,
  brown: PlayerColor.BROWN,
  white: PlayerColor.WHITE,
  pink: PlayerColor.PINK,
};

interface Container {
  type: "user" | "game";
  id: number;
}

interface PlayerColorContainer {
  type: "playerColor";
  colorName: string;
  playerColor: PlayerColor;
}

type ParsedMessagePart = string | Container | PlayerColorContainer;

function parseColorsInText(text: string): Array<string | PlayerColorContainer> {
  const parts: Array<string | PlayerColorContainer> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PLAYER_COLOR_PARSER)) {
    const colorName = match[1].toLowerCase();
    const playerColor = PLAYER_COLOR_LOOKUP[colorName];
    if (playerColor == null) {
      continue;
    }

    parts.push(text.substring(lastIndex, match.index));
    parts.push({
      type: "playerColor",
      colorName,
      playerColor,
    });
    lastIndex = match.index + match[0].length;
  }

  parts.push(text.substring(lastIndex));
  return parts;
}

function moveColorChipBeforeUser(parts: ParsedMessagePart[]): ParsedMessagePart[] {
  const reordered: ParsedMessagePart[] = [];

  for (let index = 0; index < parts.length; index++) {
    const current = parts[index];
    if (typeof current === "string" || current.type !== "user") {
      reordered.push(current);
      continue;
    }

    const next = parts[index + 1];
    const nextNext = parts[index + 2];

    if (
      typeof next === "string" &&
      /^\s+$/.test(next) &&
      typeof nextNext !== "string" &&
      nextNext.type === "playerColor"
    ) {
      reordered.push(nextNext, next, current);
      index += 2;
      continue;
    }

    if (typeof next !== "string" && next?.type === "playerColor") {
      reordered.push(next, " ", current);
      index += 1;
      continue;
    }

    reordered.push(current);
  }

  return reordered;
}

function isActorPrefixedLogMessage(message: string): boolean {
  return ACTOR_PREFIX_PARSER.test(message);
}

function isWhitespaceOnlyPart(part: ParsedMessagePart | undefined): part is string {
  return typeof part === "string" && /^\s*$/.test(part);
}

function stripLeadingActorColorToken(parts: ParsedMessagePart[]): ParsedMessagePart[] {
  let startIndex = 0;

  while (startIndex < parts.length && isWhitespaceOnlyPart(parts[startIndex])) {
    startIndex += 1;
  }

  const firstContentPart = parts[startIndex];
  if (
    typeof firstContentPart !== "string" &&
    firstContentPart?.type === "playerColor"
  ) {
    startIndex += 1;
    if (isWhitespaceOnlyPart(parts[startIndex])) {
      startIndex += 1;
    }
  }

  const remaining = parts.slice(startIndex);
  if (typeof remaining[0] === "string") {
    return [remaining[0].replace(/^\s+/, ""), ...remaining.slice(1)];
  }
  return remaining;
}

function LogMessage({
  message,
  currentUserId,
  userColorLookup,
  messageType,
  collapseLeadingActorMention = false,
}: {
  message: string;
  currentUserId?: number;
  userColorLookup: Record<number, PlayerColor>;
  messageType: MessageType;
  collapseLeadingActorMention?: boolean;
}) {
  const messageParsed = useMemo(() => {
    const parts: ParsedMessagePart[] = [];
    let lastIndex = 0;
    for (const match of message.matchAll(USER_MESSAGE_PARSER)) {
      parts.push(...parseColorsInText(message.substring(lastIndex, match.index)));
      const referenceType: "user" | "game" = match[1] === "user" ? "user" : "game";
      parts.push({ type: referenceType, id: Number(match[2]) });
      lastIndex = match.index + match[0].length;
    }
    parts.push(...parseColorsInText(message.substring(lastIndex)));
    const normalizedParts = moveColorChipBeforeUser(parts);
    if (collapseLeadingActorMention) {
      return stripLeadingActorColorToken(normalizedParts);
    }
    return normalizedParts;
  }, [collapseLeadingActorMention, message]);

  return (
    <>
      {messageParsed.map((part, index) => {
        const isUserMention = typeof part !== "string" && part.type === "user";
        const isMentionedUser = isUserMention && part.id === currentUserId;
        const previousPart = messageParsed[index - 1];
        const nextPart = messageParsed[index + 1];
        const previousPreviousPart = messageParsed[index - 2];
        const nextNextPart = messageParsed[index + 2];
        const previousIsWhitespace =
          typeof previousPart === "string" && /^\s+$/.test(previousPart);
        const nextIsWhitespace =
          typeof nextPart === "string" && /^\s+$/.test(nextPart);
        const hasAdjacentColorToken =
          (typeof previousPart !== "string" && previousPart?.type === "playerColor") ||
          (typeof nextPart !== "string" && nextPart?.type === "playerColor") ||
          (previousIsWhitespace &&
            typeof previousPreviousPart !== "string" &&
            previousPreviousPart?.type === "playerColor") ||
          (nextIsWhitespace &&
            typeof nextNextPart !== "string" &&
            nextNextPart?.type === "playerColor");
        
        const mentionClasses = cx(
          isUserMention && messageType === MessageType.CHAT && styles.userMention,
          isMentionedUser && styles.mentionedUser
        );
        
        return (
          <span key={index} className={mentionClasses || undefined}>
            {typeof part === "string" ? (
              part
            ) : part.type === "playerColor" ? (
              <span
                className={styles.playerColorToken}
                role="img"
                aria-label={`player color ${part.colorName}`}
                title={`Player color: ${part.colorName}`}
              >
                <Icon
                  name="circle"
                  className={`${styles.playerColorCircle} ${getPlayerColorCss(part.playerColor)}`}
                  aria-hidden="true"
                />
              </span>
            ) : part.type === "game" ? (
              <a href={`/app/games/${part.id}`}>Game #{part.id}</a>
            ) : (
              <ReferencedUser
                userId={part.id}
                showColorChip={!hasAdjacentColorToken}
                playerColor={userColorLookup[part.id]}
              />
            )}
          </span>
        );
      })}
    </>
  );
}

function ReferencedUser({
  userId,
  showColorChip,
  playerColor,
}: {
  userId: number;
  showColorChip: boolean;
  playerColor?: PlayerColor;
}) {
  return (
    <>
      {showColorChip && playerColor != null && (
        <span
          className={styles.playerColorToken}
          role="img"
          aria-label={`player color ${playerColorToString(playerColor)}`}
          title={`Player color: ${playerColorToString(playerColor)}`}
        >
          <Icon
            name="circle"
            className={`${styles.playerColorCircle} ${getPlayerColorCss(playerColor)}`}
            aria-hidden="true"
          />
        </span>
      )}
      <Username userId={userId} useAt={true} useLink={true} />
    </>
  );
}

interface LogMessagesProps {
  messages: MessageApi[];
  allMessages?: MessageApi[];
  fetchNextPage?: () => void;
  disableNextPage?: boolean;
  currentUserId?: number;
  userColorLookup: Record<number, PlayerColor>;
}

// Simple classnames helper
function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function LogMessages({
  messages,
  allMessages,
  fetchNextPage,
  disableNextPage,
  currentUserId,
  userColorLookup,
}: LogMessagesProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );

  const [canScrollToBottom, setCanScrollToBottom] = useState(false);
  const [logHeight, setLogHeight] = useState(250);
  const { stayScrolled, isScrolled, scrollBottom } = useStayScrolled(ref);

  const onScroll = useCallback(() => {
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom]);

  useLayoutEffect(() => {
    // Tell the user to scroll down to see the newest messages if the element wasn't scrolled down
    stayScrolled();
    setCanScrollToBottom(!isScrolled());
  }, [isScrolled, setCanScrollToBottom, messages.length]);

  const onResizeMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      resizeStateRef.current = {
        startY: event.clientY,
        startHeight: logHeight,
      };

      const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (resizeStateRef.current == null) {
          return;
        }

        const deltaY = moveEvent.clientY - resizeStateRef.current.startY;
        const maxHeight = Math.round(window.innerHeight * 0.75);
        const nextHeight = Math.max(
          180,
          Math.min(maxHeight, resizeStateRef.current.startHeight + deltaY),
        );
        setLogHeight(nextHeight);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        resizeStateRef.current = null;
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      // Cleanup listeners on unmount or if component changes
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        resizeStateRef.current = null;
      };
    },
    [logHeight],
  );

  const hasMessages = messages.length > 0;
  const hasFilteredOutMessages = allMessages && allMessages.length > messages.length;

  // Track actor for alternating background grouping - memoized to ensure consistent grouping
  const messageGrouping = useMemo(() => {
    const grouping: number[] = [];
    let previousActor: number | null = null;
    let currentActorGroup = 0;
    
    messages.forEach((log) => {
      const currentActor = getMessageActor(log);
      if (currentActor !== null && currentActor !== previousActor) {
        currentActorGroup = 1 - currentActorGroup;
        previousActor = currentActor;
      }
      grouping.push(currentActorGroup);
    });
    
    return grouping;
  }, [messages]);

  return (
    <div className={styles.logContainer}>
      <div
        className={styles.logList}
        style={{ height: `${logHeight}px` }}
        ref={ref}
        onScroll={onScroll}
      >
        {fetchNextPage != null && (
          <button
            onClick={fetchNextPage}
            disabled={disableNextPage}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        )}
        {hasMessages ? (
          messages.map((log, index) => {
            const dateString = log.date.toLocaleDateString();
            const isNewDay =
              index == 0 ||
              dateString !== messages[index - 1].date.toLocaleDateString();

            const messageType = detectMessageType(log);
            const isMentioned =
              messageType === MessageType.CHAT &&
              containsMentionOfUser(log.message, currentUserId);
            const typeClassName = MessageType[messageType];
            const previousLog = index > 0 ? messages[index - 1] : undefined;
            const nextLog = index < messages.length - 1 ? messages[index + 1] : undefined;
            const currentActor = getMessageActor(log);
            const previousActor = previousLog != null ? getMessageActor(previousLog) : null;
            const nextActor = nextLog != null ? getMessageActor(nextLog) : null;
            const isChatMessage = messageType === MessageType.CHAT;
            const isPlayerActionStyleMessage =
              !isChatMessage && isActorPrefixedLogMessage(log.message);

            const previousIsSameCollapsibleKind =
              previousLog != null &&
              (
                (isChatMessage && detectMessageType(previousLog) === MessageType.CHAT) ||
                (
                  isPlayerActionStyleMessage &&
                  detectMessageType(previousLog) !== MessageType.CHAT &&
                  isActorPrefixedLogMessage(previousLog.message)
                )
              );

            const nextIsSameCollapsibleKind =
              nextLog != null &&
              (
                (isChatMessage && detectMessageType(nextLog) === MessageType.CHAT) ||
                (
                  isPlayerActionStyleMessage &&
                  detectMessageType(nextLog) !== MessageType.CHAT &&
                  isActorPrefixedLogMessage(nextLog.message)
                )
              );

            const shouldCollapseActor =
              !isNewDay &&
              (isChatMessage || isPlayerActionStyleMessage) &&
              currentActor != null &&
              previousLog != null &&
              previousIsSameCollapsibleKind &&
              previousActor === currentActor;

            const shouldCollapseAuthor =
              shouldCollapseActor &&
              isChatMessage &&
              log.userId != null;

            const nextIsContinuation =
              nextLog != null &&
              (isChatMessage || isPlayerActionStyleMessage) &&
              currentActor != null &&
              nextIsSameCollapsibleKind &&
              nextActor === currentActor &&
              nextLog.date.toLocaleDateString() === dateString;

            const currentActorGroup = messageGrouping[index];
            const actorGroupClass =
              currentActor !== null ? `actorGroup${currentActorGroup}` : null;

            return (
              <Fragment key={log.id}>
                {isNewDay && (
                  <p
                    className={cx(
                      styles.dateChange,
                      index !== 0 && styles.dateChangeWithGap,
                    )}
                  >
                    -- {dateString} --
                  </p>
                )}
                <p
                  className={cx(
                    styles.logLine,
                    shouldCollapseActor && styles.logLineContinuation,
                    nextIsContinuation && styles.logLineBeforeContinuation,
                    styles[typeClassName],
                    actorGroupClass && styles[actorGroupClass],
                    isMentioned && styles.mentionHighlight,
                  )}
                >
                  <span className={styles.time}>{timeFormat(log.date)}</span>{" "}
                  {log.userId != null && (
                    <>
                      <span
                        className={cx(
                          styles.username,
                          shouldCollapseAuthor && styles.usernamePlaceholder,
                        )}
                        aria-hidden={shouldCollapseAuthor}
                      >
                        {userColorLookup[log.userId] != null && (
                          <span
                            className={styles.playerColorToken}
                            role="img"
                            aria-label={`player color ${playerColorToString(
                              userColorLookup[log.userId],
                            )}`}
                            title={`Player color: ${playerColorToString(
                              userColorLookup[log.userId],
                            )}`}
                          >
                            <Icon
                              name="circle"
                              className={`${styles.playerColorCircle} ${getPlayerColorCss(
                                userColorLookup[log.userId],
                              )}`}
                              aria-hidden="true"
                            />
                          </span>
                        )}
                        <Username userId={log.userId} useLink={true} />
                      </span>
                      <span
                        className={shouldCollapseAuthor ? styles.usernamePlaceholder : undefined}
                        aria-hidden={shouldCollapseAuthor}
                      >
                        :
                      </span>
                    </>
                  )}{" "}
                  <span>
                    <LogMessage
                      message={log.message}
                      currentUserId={currentUserId}
                      userColorLookup={userColorLookup}
                      messageType={messageType}
                      collapseLeadingActorMention={
                        shouldCollapseActor &&
                        isPlayerActionStyleMessage
                      }
                    />
                  </span>
                </p>
              </Fragment>
            );
          })
        ) : hasFilteredOutMessages ? (
          <div className={styles.emptyState}>
            No messages match current filters. Enable more filters to see messages.
          </div>
        ) : null}
      </div>
      <div
        className={styles.resizeHandle}
        onMouseDown={onResizeMouseDown}
        role="separator"
        aria-label="Resize chat log"
        aria-orientation="horizontal"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const handle = event.currentTarget as HTMLDivElement;
            const logList = handle.previousElementSibling as HTMLElement | null;
            if (!logList) {
              return;
            }
            const step = 10;
            const minHeight = 50;
            const currentHeight = logList.offsetHeight;
            const delta = event.key === "ArrowUp" ? step : -step;
            const newHeight = Math.max(minHeight, currentHeight + delta);
            logList.style.height = `${newHeight}px`;
          }
        }}
      />
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
