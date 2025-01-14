

import { useNotifications } from '@toolpad/core';
import { useCallback, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageApi, PageCursor } from '../../api/message';
import { ClientToServerEvents, ServerToClientEvents } from '../../api/socket';
import { tsr } from './client';
import { environment } from './environment';
import { handleError } from './network';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(environment.socketHost);

socket.on('connect', () => {
  console.log('got a connection');
});

interface UseMessages {
  messages: MessageApi[];
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

const emptyMessages: MessageApi[] = [];

export function useMessages(gameId?: number): UseMessages {
  useJoinRoom(gameId);
  const notifications = useNotifications();
  const queryClient = tsr.useQueryClient();
  const queryKey = ['messages', gameId];
  const { data, isLoading, error, fetchNextPage, hasNextPage } = tsr.messages.list.useInfiniteQuery({
    queryKey,
    queryData: ({ pageParam }) => ({
      query: { gameId, pageCursor: pageParam },
    }),
    initialPageParam: (undefined as (PageCursor | undefined)),
    getNextPageParam: ({ status, body }): PageCursor | undefined => {
      if (status !== 200) return undefined;
      return body.nextPageCursor;
    },
  });

  const messages = useMemo(() => data == null
    ? emptyMessages
    : data.pages.flatMap((page) => page.body.messages.map((m) => MessageApi.parse(m))).sort((a, b) => a.id < b.id ? -1 : 1)
    , [data]);

  useEffect(() => {
    if (error == null) return;
    notifications.show('Failed to load messages', { autoHideDuration: 2000, severity: 'error' });
  }, [error]);

  const updateLogs = useCallback((updater: (logs: MessageApi[]) => MessageApi[]) => {
    queryClient.messages.list.setQueryData(queryKey, () => {
      const newMessages = updater(messages);
      const nextPageCursors = data == null ? [undefined] : data.pages.map(page => page.body.nextPageCursor);
      const nextPageCursor = nextPageCursors.reduce((minNextPageCursor, nextPageCursor) => {
        if (minNextPageCursor == null) return minNextPageCursor;
        if (nextPageCursor == null) return nextPageCursor;
        return Math.min(nextPageCursor, minNextPageCursor);
      }, nextPageCursors[0]);
      // TODO: fix the typing of this particular method.
      return {
        pageParams: [undefined],
        pages: [{ status: 200, headers: new Headers(), body: { messages: newMessages, nextPageCursor } }],
      } as any;
    });
  }, [queryClient, queryKey, messages, data]);

  useEffect(() => {
    const listener = (message: MessageApi) => {
      updateLogs((logs) => logs.concat([message]));
    };
    socket.on('newLog', listener);
    return () => {
      socket.off('newLog', listener);
    };
  }, [gameId, updateLogs]);

  useEffect(() => {
    const listener = (logId: number) => {
      updateLogs((logs) => logs.filter((log) => log.id !== logId));
    };
    socket.on('destroyLog', listener);
    return () => {
      socket.off('destroyLog', listener);
    };
  }, [gameId, updateLogs]);

  return { messages, isLoading, fetchNextPage, hasNextPage };
}

export function useJoinRoom(gameId?: number) {
  useEffect(() => {
    if (gameId == null) {
      socket.emit('joinHomeRoom');
    } else {
      socket.emit('joinGameRoom', gameId);
    }
    return () => {
      if (gameId == null) {
        socket.emit('leaveHomeRoom');
      } else {
        socket.emit('leaveGameRoom', gameId);
      }
    };
  }, [gameId]);
}

export function useSendChat(gameId?: number) {
  const { mutate, error, isPending } = tsr.messages.sendChat.useMutation();
  handleError(isPending, error);

  const sendChat = useCallback((message: string, onSuccess: () => void) => {
    if (message == '') return;
    mutate({ body: { message, gameId } }, { onSuccess });
  }, [mutate]);
  return { sendChat, isPending };
}