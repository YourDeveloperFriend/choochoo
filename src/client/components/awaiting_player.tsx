import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GamePageCursor } from "../../api/game";
import { tsr } from "../services/client";
import { useJoinRoom, useSocket } from "../services/socket";
import { useMe } from "../services/me";

const AwaitingGameIdsContext = createContext<Set<number>>(new Set());

export function useAwaitingGameIds(): Set<number> {
  return useContext(AwaitingGameIdsContext);
}

export function AwaitingContextProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const socket = useSocket();
  const queryClient = useQueryClient();

  useJoinRoom();

  const queryKey = useMemo(() => ["awaitingGames", me?.id], [me?.id]);

  const { data } = tsr.games.list.useInfiniteQuery({
    queryKey,
    queryData: ({ pageParam }) => ({
      query: {
        status: ["ACTIVE"],
        userId: me?.id,
        pageCursor: pageParam,
      },
    }),
    initialPageParam: undefined as GamePageCursor | undefined,
    getNextPageParam: () => undefined,
    enabled: me != null,
  });

  const awaitingGameIds = useMemo(() => {
    if (!data || !me) return new Set<number>();
    const games = data.pages[0]?.body?.games ?? [];
    return new Set(
      games
        .filter((game) => game.activePlayerId === me.id)
        .map((game) => game.id),
    );
  }, [data, me]);

  useEffect(() => {
    function handleGameUpdate() {
      queryClient.invalidateQueries({ queryKey });
    }
    socket.on("gameUpdateLite", handleGameUpdate);
    socket.on("gameDestroy", handleGameUpdate);
    return () => {
      socket.off("gameUpdateLite", handleGameUpdate);
      socket.off("gameDestroy", handleGameUpdate);
    };
  }, [queryKey, queryClient, socket]);

  return (
    <AwaitingGameIdsContext.Provider value={awaitingGameIds}>
      {children}
    </AwaitingGameIdsContext.Provider>
  );
}
