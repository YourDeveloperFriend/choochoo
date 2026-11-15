import { InfiniteData } from "@tanstack/react-query";
import { DataResponse } from "@ts-rest/react-query/v5";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { MessageApi, messageContract, PageCursor } from "../../api/message";
import { tsr } from "./client";
import { handleError } from "./network";
import { useJoinRoom, useSocket } from "./socket";

const emptyMessages: MessageApi[] = [];

interface UseMessages {
  messages: MessageApi[];
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export function useSendChat(gameId?: number) {
  const { mutate, error, isPending } = tsr.messages.sendChat.useMutation();
  handleError(isPending, error);

  const sendChat = useCallback(
    (message: string, onSuccess: () => void) => {
      if (message == "") {
        return;
      }
      mutate({ body: { message, gameId } }, { onSuccess });
    },
    [mutate],
  );
  return { sendChat, isPending };
}

function parseMessages(
  data?: InfiniteData<DataResponse<typeof messageContract.list>>,
): MessageApi[] {
  return data == null
    ? emptyMessages
    : data.pages
        .flatMap((page) => page.body.messages.map((m) => MessageApi.parse(m)))
        .sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function useMessages(gameId?: number): UseMessages {
  useJoinRoom(gameId);
  const socket = useSocket();
  const queryClient = tsr.useQueryClient();
  const queryKey = ["messages", gameId];
  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    tsr.messages.list.useInfiniteQuery({
      queryKey,
      queryData: ({ pageParam }) => ({
        query: { gameId, pageCursor: pageParam },
      }),
      initialPageParam: undefined as PageCursor | undefined,
      getNextPageParam: ({ status, body }): PageCursor | undefined => {
        if (status !== 200) {
          return undefined;
        }
        return body.nextPageCursor;
      },
    });

  const messages = useMemo(() => parseMessages(data), [data]);

  useEffect(() => {
    if (error == null) {
      return;
    }
    toast.error("Failed to load messages");
  }, [error]);

  const updateLogs = useCallback(
    (updater: (logs: MessageApi[]) => MessageApi[]) => {
      queryClient.messages.list.setQueryData(queryKey, (d) => {
        const data = d as
          | InfiniteData<DataResponse<typeof messageContract.list>>
          | undefined;
        const messages = parseMessages(data);
        const newMessages = updater(messages);
        const nextPageCursors =
          data == null
            ? [undefined]
            : data.pages.map((page) => page.body.nextPageCursor);
        const nextPageCursor = nextPageCursors.reduce(
          (minNextPageCursor, nextPageCursor) => {
            if (minNextPageCursor == null) {
              return minNextPageCursor;
            }
            if (nextPageCursor == null) {
              return nextPageCursor;
            }
            return Math.min(nextPageCursor, minNextPageCursor);
          },
          nextPageCursors[0],
        );
        // TODO: fix the typing of this particular method.
        return {
          pageParams: [undefined],
          pages: [
            {
              status: 200,
              headers: new Headers(),
              body: { messages: newMessages, nextPageCursor },
            },
          ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    const listener = (message: MessageApi) => {
      if (message.gameId !== gameId) {
        return;
      }
      updateLogs((logs) => logs.concat([message]));
    };
    socket.on("newLog", listener);
    return () => {
      socket.off("newLog", listener);
    };
  }, [gameId, updateLogs]);

  useEffect(() => {
    const listener = (logId: number) => {
      updateLogs((logs) => logs.filter((log) => log.id !== logId));
    };
    socket.on("destroyLog", listener);
    return () => {
      socket.off("destroyLog", listener);
    };
  }, [gameId, updateLogs]);

  return { messages, isLoading, fetchNextPage, hasNextPage };
}
