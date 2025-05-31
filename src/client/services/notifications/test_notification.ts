import { useCallback } from "react";
import { NotificationPreferences } from "../../../api/notifications";
import { emitSuccess } from "../../utils/notify";
import { tsr } from "../client";
import { handleError } from "../network";

export function useSendTestNotification() {
  const { mutate, error, isPending } = tsr.notifications.test.useMutation();
  const validationError = handleError(isPending, error);

  const test = useCallback(
    (preferences: NotificationPreferences) =>
      mutate(
        {
          body: { preferences },
        },
        {
          onSuccess: () => {
            emitSuccess();
          },
        },
      ),
    [mutate],
  );

  return { test, isPending, validationError };
}
