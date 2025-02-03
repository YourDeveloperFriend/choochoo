import { useDialogs, useNotifications } from "@toolpad/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValidationError } from "../../api/error";
import {
  CreateGameApi,
  GameApi,
  GameLiteApi,
  GamePageCursor,
  GameStatus,
  ListGamesApi,
} from "../../api/game";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { ActionConstructor } from "../../engine/game/phase_module";
import { InvalidInputError } from "../../utils/error";
import { entries, peek } from "../../utils/functions";
import { Entry, WithFormNumber } from "../../utils/types";
import { assert, assertNever } from "../../utils/validate";
import { useUpdateAutoActionCache } from "../auto_action/hooks";
import { useMostRecentValue } from "../utils/hooks";
import { useInjected, useInjectedMemo } from "../utils/injection_context";
import { tsr } from "./client";
import { useIsAdmin, useMe } from "./me";
import { handleError, toValidationError } from "./network";
import { useJoinRoom, useSocket } from "./socket";

function getQueryKey(gameId: number | string): string[] {
  return ["games", `${gameId}`];
}

function checkMatch(game: GameLiteApi, entry: Entry<ListGamesApi>): boolean {
  if (entry == null) return true;
  const [key, value] = entry;
  if (value == null) return true;
  switch (key) {
    case "userId":
      return game.playerIds.includes(value);
    case "excludeUserId":
      return !game.playerIds.includes(value);
    case "status":
      return value.includes(game.status);
    case "gameKey":
      return game.gameKey == value;
    case "name":
      return game.name.toLowerCase().includes(value.toLowerCase());

    case "pageCursor":
    case "pageSize":
    case "order":
      return true;
    default:
      assertNever(entry);
  }
}

function checkMatches(baseQuery: ListGamesApi, game: GameLiteApi): boolean {
  return entries(baseQuery).every((entry) => checkMatch(game, entry));
}

export function useGameList(baseQuery: ListGamesApi) {
  const socket = useSocket();
  const tsrQueryClient = tsr.useQueryClient();
  const queryWithLimit: ListGamesApi = { pageSize: 20, ...baseQuery };
  const queryKeyFromFilter = Object.entries(queryWithLimit)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
  const queryKey = ["gameList", queryKeyFromFilter];
  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    tsr.games.list.useInfiniteQuery({
      queryKey,
      queryData: ({ pageParam }) => ({
        query: { ...queryWithLimit, pageCursor: pageParam },
      }),
      initialPageParam: undefined as GamePageCursor | undefined,
      getNextPageParam: ({ status, body }): GamePageCursor | undefined => {
        if (status !== 200) return undefined;
        return body.nextPageCursor;
      },
    });

  handleError(isLoading, error);

  const [page, setPage] = useState(0);

  const games = data?.pages[page]?.body.games;

  const isOnLastPage =
    data != null && !hasNextPage && data.pages.length - 1 === page;
  const nextPage = useCallback(() => {
    if (isLoading || isOnLastPage) return;
    setPage(page + 1);
    if (data != null && hasNextPage && data.pages.length - 1 === page) {
      fetchNextPage();
    }
  }, [isLoading, setPage, page, hasNextPage, data]);

  const hasPrevPage = page > 0;
  const prevPage = useCallback(() => {
    if (!hasPrevPage) return;
    setPage(page - 1);
  }, [page, setPage, page]);

  useEffect(() => {
    function updateGameList(
      updater: (pages: GameLiteApi[][]) => GameLiteApi[][],
    ) {
      tsrQueryClient.games.list.setQueryData(queryKey, (r) => {
        if (games == null) return r;

        assert(data != null);

        const newPages = updater(data.pages.map((page) => page.body.games));

        const pageParams = newPages.map((_, index) => {
          return newPages
            .slice(index)
            .flatMap((games) => games.map(({ id }) => id));
        });

        // TODO: fix the typing of this particular method.
        return {
          pageParams,
          pages: newPages.map((games) => ({
            status: 200,
            headers: new Headers(),
            body: { games },
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });
    }
    function setGame(game: GameLiteApi) {
      updateGameList((pages) => {
        const present = pages.some((games) =>
          games.some((other) => other.id === game.id),
        );

        const matchesQuery = checkMatches(baseQuery, game);

        if (matchesQuery) {
          if (present) {
            return pages.map((games) =>
              games.map((other) => (other.id === game.id ? game : other)),
            );
          } else {
            return pages.map((games, index) => {
              const lastOfPrevious =
                index === 0 ? game : peek(pages[index - 1]);
              return [lastOfPrevious, ...games.slice(0, games.length - 1)];
            });
          }
        } else if (present) {
          return removeGame(pages, game.id);
        } else {
          return pages;
        }
      });
    }

    function removeGame(
      pages: GameLiteApi[][],
      gameId: number,
    ): GameLiteApi[][] {
      const pageIndex = pages.findIndex((games) =>
        games.some((other) => other.id === gameId),
      );
      return pages.map((games, index) => {
        if (index < pageIndex) return games;
        const firstOfNext = pages[index + 1]?.[0];
        const firstOfNextArr = firstOfNext != null ? [firstOfNext] : [];
        if (index === pageIndex) {
          return games
            .filter((other) => other.id !== gameId)
            .concat(firstOfNextArr);
        } else {
          return games.slice(1).concat(firstOfNextArr);
        }
      });
    }

    function deleteGame(gameId: number) {
      updateGameList((pages) => removeGame(pages, gameId));
    }

    socket.on("gameUpdateLite", setGame);
    socket.on("gameDestroy", deleteGame);
    return () => {
      socket.off("gameUpdateLite", setGame);
      socket.off("gameDestroy", deleteGame);
    };
  }, [queryKey, baseQuery, data]);

  return {
    games,
    hasNextPage: !isOnLastPage,
    nextPage,
    hasPrevPage,
    prevPage,
    isLoading,
  };
}

export function useSetGame() {
  const tsrQueryClient = tsr.useQueryClient();
  return (game: GameApi) => {
    tsrQueryClient.games.get.setQueryData(
      getQueryKey(game.id),
      (r) => r && { ...r, status: 200, body: { game } },
    );
  };
}

export function useSetGameSuccess() {
  const setGame = useSetGame();
  return useCallback(
    ({ body }: { status: 200; body: { game: GameApi } }) => {
      setGame(body.game);
    },
    [setGame],
  );
}

export function useGame(): GameApi {
  const setGame = useSetGame();
  const socket = useSocket();

  const gameId = parseInt(useParams().gameId!);
  const { data } = tsr.games.get.useSuspenseQuery({
    queryKey: getQueryKey(gameId),
    queryData: { params: { gameId } },
  });

  useJoinRoom();

  useEffect(() => {
    function internalSetGame(game: GameApi) {
      console.log("got new game", game.id, gameId);
      if (game.id !== gameId) return;
      setGame(game);
    }
    socket.on("gameUpdate", internalSetGame);
    return () => {
      socket.off("gameUpdate", internalSetGame);
    };
  }, [gameId]);

  return data.body.game;
}

export type CreateGameInputApi = WithFormNumber<
  CreateGameApi,
  "minPlayers" | "maxPlayers"
>;

export function useCreateGame(): {
  validateGame: (game: CreateGameInputApi) => CreateGameApi | undefined;
  createGame: (game: CreateGameInputApi) => void;
  isPending: boolean;
  validationError?: ValidationError;
} {
  const { mutate, error, isPending } = tsr.games.create.useMutation();
  const navigate = useNavigate();
  const networkValidationError = handleError(isPending, error);
  const [preMutateError, setPreMutateError] = useState<
    ValidationError | undefined
  >(undefined);
  const validationError = useMostRecentValue(
    networkValidationError,
    preMutateError,
  );

  const validateGame = useCallback(
    (bodyUnmodified: CreateGameInputApi) => {
      const body = CreateGameApi.safeParse(bodyUnmodified);
      if (!body.success) {
        setPreMutateError(toValidationError(body.error));
        return undefined;
      }
      setPreMutateError(undefined);
      return body.data;
    },
    [setPreMutateError],
  );

  const createGame = useCallback(
    (bodyUnmodified: CreateGameInputApi) => {
      const body = validateGame(bodyUnmodified);
      if (body != null) {
        mutate(
          { body },
          {
            onSuccess: (data) => {
              navigate("/app/games/" + data.body.game.id);
            },
          },
        );
      }
    },
    [mutate, validateGame],
  );

  return { validateGame, createGame, isPending, validationError };
}

export function useDeleteGame(game: GameLiteApi) {
  const me = useMe();
  const isAdmin = useIsAdmin();
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const { mutate, error, isPending } = tsr.games.deleteGame.useMutation();
  handleError(isPending, error);

  const perform = useCallback(async () => {
    const result = await dialogs.confirm(
      "Are you sure you want to delete this game?",
    );

    if (!result) return;

    mutate(
      { params: { gameId: game.id } },
      {
        onSuccess: () => {
          notifications.show("Success", {
            autoHideDuration: 2000,
            severity: "success",
          });
        },
      },
    );
  }, [game.id]);

  const canBeDeleted =
    game.status === GameStatus.enum.LOBBY || game.playerIds.length === 1;

  const canPerform = isAdmin || (canBeDeleted && game.playerIds[0] === me?.id);

  return { canPerform, perform, isPending };
}

interface GameAction {
  canPerform: boolean;
  isPending: boolean;
  perform(): void;
}

export function useJoinGame(game: GameLiteApi): GameAction {
  const onSuccess = useSetGameSuccess();
  const me = useMe();
  const { mutate, error, isPending } = tsr.games.join.useMutation();
  handleError(isPending, error);

  const perform = useCallback(
    () => mutate({ params: { gameId: game.id } }, { onSuccess }),
    [game.id],
  );

  const canPerform =
    me != null &&
    game.status == GameStatus.enum.LOBBY &&
    !game.playerIds.includes(me.id) &&
    game.playerIds.length < game.config.maxPlayers;

  return { canPerform, perform, isPending };
}

export function useLeaveGame(game: GameLiteApi): GameAction {
  const onSuccess = useSetGameSuccess();
  const me = useMe();
  const { mutate, error, isPending } = tsr.games.leave.useMutation();
  handleError(isPending, error);

  const perform = useCallback(
    () => mutate({ params: { gameId: game.id } }, { onSuccess }),
    [game.id],
  );

  const canPerform =
    me != null &&
    game.status == GameStatus.enum.LOBBY &&
    game.playerIds.includes(me.id) &&
    game.playerIds[0] !== me.id;

  return { canPerform, perform, isPending };
}

export function useSetGameData() {
  const onSuccess = useSetGameSuccess();
  const game = useGame();
  const { mutate, error, isPending } = tsr.games.setGameData.useMutation();
  handleError(isPending, error);

  const setGameData = useCallback(
    (gameData: string) =>
      mutate(
        { params: { gameId: game.id }, body: { gameData } },
        { onSuccess },
      ),
    [game.id],
  );

  return { setGameData, isPending };
}

export function useStartGame(game: GameLiteApi): GameAction {
  const onSuccess = useSetGameSuccess();
  const me = useMe();
  const { mutate, error, isPending } = tsr.games.start.useMutation();
  handleError(isPending, error);

  const perform = useCallback(
    () => mutate({ params: { gameId: game.id } }, { onSuccess }),
    [game.id],
  );

  const canPerform =
    me != null &&
    game.status == GameStatus.enum.LOBBY &&
    game.playerIds[0] === me.id &&
    game.playerIds.length >= game.config.minPlayers;

  return { canPerform, perform, isPending };
}

interface ActionHandler<T> {
  emit(data: T): void;
  canEmit: boolean;
  isPending: boolean;
  canEmitUserId?: number;
  getErrorMessage(t: T): string | undefined;
}

type EmptyActionHandler = Omit<
  ActionHandler<unknown>,
  "emit" | "getErrorMessage"
> & {
  emit(): void;
  getErrorMessage(): string | undefined;
};

export function useEmptyAction(
  action: ActionConstructor<Record<string, never>>,
): EmptyActionHandler {
  const {
    emit: oldEmit,
    getErrorMessage: oldGetErrorMessage,
    ...rest
  } = useAction(action);
  const emit = useCallback(() => {
    oldEmit({});
  }, [oldEmit]);
  const getErrorMessage = useCallback(() => oldGetErrorMessage({}), []);
  return { emit, getErrorMessage, ...rest };
}

/** Like `useState` but it resets when the game version changes. */
export function useGameVersionState<T>(initialValue: T): [T, (t: T) => void] {
  const game = useGame();
  const [state, setState] = useState(initialValue);
  const ref = useRef(game.version);
  const externalState = ref.current === game.version ? state : initialValue;
  const externalSetState = useCallback(
    (state: T) => {
      ref.current = game.version;
      setState(state);
    },
    [setState, game.version],
  );
  return [externalState, externalSetState];
}

export function useAction<T extends object>(
  action: ActionConstructor<T>,
): ActionHandler<T> {
  const me = useMe();
  const game = useGame();
  const onSuccess = useSetGameSuccess();
  const updateAutoActionCache = useUpdateAutoActionCache(game.id);
  const phaseDelegator = useInjected(PhaseDelegator);
  const notifications = useNotifications();
  const { mutate, isPending, error } = tsr.games.performAction.useMutation();
  const actionInstance = useInjectedMemo(action);
  handleError(isPending, error);

  const actionName = action.action;

  const emit = useCallback(
    (actionData: T) => {
      if ("view" in actionData && actionData["view"] instanceof Window) {
        notifications.show("Error performing action", {
          autoHideDuration: 2000,
          severity: "success",
        });
        throw new Error(
          "Cannot use event as actionData. You likely want to use useEmptyAction",
        );
      }
      mutate(
        { params: { gameId: game.id }, body: { actionName, actionData } },
        {
          onSuccess: (r) => {
            onSuccess(r);
            updateAutoActionCache(r.body.auto);

            notifications.show("Success", {
              autoHideDuration: 2000,
              severity: "success",
            });
          },
        },
      );
    },
    [game.id, actionName],
  );

  const actionCanBeEmitted =
    game.status == GameStatus.enum.ACTIVE &&
    phaseDelegator.get().canEmit(action);

  const canEmitUserId = actionCanBeEmitted ? game.activePlayerId : undefined;
  const canEmit = me?.id === game.activePlayerId && actionCanBeEmitted;
  const getErrorMessage = useCallback(
    (data: T) => {
      try {
        actionInstance.value.validate(actionInstance.value.assertInput(data));
      } catch (e) {
        if (e instanceof InvalidInputError) {
          return e.message;
        }
        throw e;
      }
    },
    [actionInstance],
  );

  return { emit, canEmit, canEmitUserId, getErrorMessage, isPending };
}

export interface UndoAction {
  undo(): void;
  canUndo: boolean;
  isPending: boolean;
}

export function useUndoAction(): UndoAction {
  const isAdmin = useIsAdmin();
  const game = useGame();
  const onSuccess = useSetGameSuccess();
  const me = useMe();
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const { mutate, error, isPending } = tsr.games.undoAction.useMutation();
  handleError(isPending, error);

  const canUndoBecausePlayer =
    game.undoPlayerId != null && game.undoPlayerId === me?.id;
  const canUndoBecauseAdmin = isAdmin;
  const canUndo = canUndoBecausePlayer || canUndoBecauseAdmin;

  const undo = useCallback(async () => {
    const adminOverride = !canUndoBecausePlayer;
    if (!canUndoBecausePlayer) {
      const shouldContinue = await dialogs.confirm(
        "This is an admin action, usually you cannot undo this action. Continue?",
      );
      if (!shouldContinue) return;
    }
    mutate(
      {
        params: { gameId: game.id },
        body: { backToVersion: game.version - 1, adminOverride },
      },
      {
        onSuccess(r) {
          onSuccess(r);

          notifications.show("Success", {
            autoHideDuration: 2000,
            severity: "success",
          });
        },
      },
    );
  }, [game.id, game.version, canUndoBecausePlayer]);

  return { undo, canUndo, isPending };
}

export interface RetryAction {
  retry(): void;
  canRetry: boolean;
  isPending: boolean;
}

export function useRetryAction(): RetryAction {
  const game = useGame();
  const onSuccess = useSetGameSuccess();
  const notifications = useNotifications();
  const { mutate, isPending, error } = tsr.games.retryLast.useMutation();
  handleError(isPending, error);

  const retry = useCallback(() => {
    const steps = Number(prompt("How many steps?"));
    if (isNaN(steps)) {
      notifications.show("Enter a valid number", {
        autoHideDuration: 2000,
        severity: "error",
      });
      return;
    }
    if (steps >= game.version) {
      notifications.show(
        "Warning, the active player may break when starting over",
        { autoHideDuration: 2000, severity: "error" },
      );
    }

    mutate(
      {
        params: { gameId: game.id },
        body: { steps },
      },
      {
        onSuccess(r) {
          onSuccess(r);
          notifications.show("Success", {
            autoHideDuration: 2000,
            severity: "success",
          });
        },
      },
    );
  }, [game.id, game.version]);

  const canRetry = useIsAdmin();

  return { retry, canRetry, isPending };
}
