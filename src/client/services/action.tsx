import { isFetchError } from "@ts-rest/react-query/v5";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { toast } from "react-toastify";
import { GameStatus } from "../../api/game";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { ActionConstructor } from "../../engine/game/phase_module";
import { InvalidInputError } from "../../utils/error";
import { ErrorCode } from "../../utils/error_code";
import { ImmutableMap } from "../../utils/immutable";
import { useUpdateAutoActionCache } from "../auto_action/hooks";
import { useConfirm } from "../components/confirm";
import { useInjected, useInjectedMemo } from "../utils/injection_context";
import { useSuccess } from "../utils/notify";
import { tsr } from "./client";
import { canEditGame, useGame, useSetGameSuccess } from "./game";
import { useMe } from "./me";
import { isErrorBody, useErrorNotifier } from "./network";

type PartialActionGetter = <T extends object>(
  ctor: ActionConstructor<T>,
) => {
  getData(): Partial<T> | undefined;
  setData(value: Partial<T>): void;
  clearData(): void;
};

const PartialActionContext = createContext<PartialActionGetter | undefined>(
  undefined,
);

export function PartialActionProvider({ children }: { children: ReactNode }) {
  const [partialActionData, setPartialActionData] =
    useState(ImmutableMap<unknown, unknown>());

  const handler: PartialActionGetter = useCallback(
    <T extends object>(ctor: ActionConstructor<T>) => ({
      getData(): T | undefined {
        return partialActionData.get(ctor) as T | undefined;
      },
      setData(value: T) {
        setPartialActionData(partialActionData.set(ctor, value));
      },
      clearData(): void {
        setPartialActionData(partialActionData.delete(ctor));
      },
    }),
    [partialActionData, setPartialActionData],
  );

  return (
    <PartialActionContext.Provider value={handler}>
      {children}
    </PartialActionContext.Provider>
  );
}

interface ActionHandler<T> {
  data?: Partial<T>;
  setData(data: Partial<T>): void;
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

export function useAction<T extends object>(
  action: ActionConstructor<T>,
): ActionHandler<T> {
  const confirm = useConfirm();
  const me = useMe();
  const game = useGame();
  const onSuccess = useSetGameSuccess();
  const dataHandler = useContext(PartialActionContext)!(action);
  const data = dataHandler.getData();
  const updateAutoActionCache = useUpdateAutoActionCache(game.id);
  const phaseDelegator = useInjected(PhaseDelegator);
  const { mutate, isPending } = tsr.games.performAction.useMutation();
  const actionInstance = useInjectedMemo(action);
  const errorNotifier = useErrorNotifier();
  const toastSuccess = useSuccess();

  const actionName = action.action;

  const setData = useCallback(
    (data: Partial<T>) => {
      dataHandler.setData(data);
    },
    [dataHandler],
  );

  const emit = useCallback(
    (actionData: T, confirmed = false) => {
      if ("view" in actionData && actionData["view"] instanceof Window) {
        toast.error("Error performing action");
        throw new Error(
          "Cannot use event as actionData. You likely want to use useEmptyAction",
        );
      }
      mutate(
        {
          params: { gameId: game.id },
          body: { actionName, actionData, confirmed },
        },
        {
          onError: (error) => {
            if (
              isFetchError(error) ||
              !isErrorBody(error.body) ||
              error.body.code !== ErrorCode.MUST_CONFIRM_ACTION
            ) {
              errorNotifier(error);
            } else {
              confirm("This action is not reversible. Continue?").then(
                (confirmed) => {
                  if (confirmed) {
                    emit(actionData, true);
                  }
                },
              );
            }
          },
          onSuccess: (r) => {
            dataHandler.clearData();
            onSuccess(r);
            updateAutoActionCache(r.body.auto);

            toastSuccess();
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
  const canEmit =
    me?.id === game.activePlayerId && actionCanBeEmitted && canEditGame(game);
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

  return {
    emit,
    canEmit,
    data,
    setData,
    canEmitUserId,
    getErrorMessage,
    isPending,
  };
}
