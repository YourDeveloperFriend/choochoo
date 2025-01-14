import { useCallback } from "react";
import { AutoAction } from "../../engine/state/auto_action";
import { tsr } from "../services/client";
import { useMe } from "../services/me";
import { handleError } from "../services/network";

function getQueryKey(meId: number, gameId: number): string[] {
  return ['autoActions', `${meId}`, `${gameId}`];
}

export function useAutoAction(gameId: number) {
  const me = useMe()!;
  const { data, isLoading, error } = tsr.autoActions.get.useSuspenseQuery({ queryKey: getQueryKey(me.id, gameId), queryData: { params: { gameId } } });
  handleError(isLoading, error);

  return data.body.auto;
}

export function useSetAutoAction(gameId: number) {
  const { mutate, error, isPending } = tsr.autoActions.set.useMutation();
  const validationError = handleError(isPending, error);
  const updateAutoActionCache = useUpdateAutoActionCache(gameId);

  const setAutoAction = useCallback((auto: AutoAction) => {
    mutate({ params: { gameId }, body: { auto } }, {
      onSuccess: () => {
        updateAutoActionCache(auto);
      },
    });
  }, [mutate, gameId]);

  return { setAutoAction, isPending, validationError };
}

export function useUpdateAutoActionCache(gameId: number) {
  const me = useMe()!;
  const tsrQueryClient = tsr.useQueryClient();
  return useCallback((auto: AutoAction) => {
    tsrQueryClient.autoActions.get.setQueryData(getQueryKey(me.id, gameId), (r) => r && ({ ...r, status: 200, body: { auto } }));
  }, [me.id, gameId]);
}