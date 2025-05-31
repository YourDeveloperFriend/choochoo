import { useCallback } from "react";
import { SubmitFeedbackApi } from "../../../api/feedback";
import { emitSuccess } from "../../utils/notify";
import { tsr } from "../client";
import { handleError } from "../network";

export function useSubmitFeedback() {
  const { mutate, error, isPending } = tsr.feedback.submit.useMutation();
  const validationError = handleError(isPending, error);

  const submitFeedback = useCallback(
    (body: SubmitFeedbackApi, onSubmit?: () => void) =>
      mutate(
        { body },
        {
          onSuccess: (_) => {
            emitSuccess("Feedback submitted");
            onSubmit?.();
          },
        },
      ),
    [],
  );
  return { submitFeedback, validationError, isPending };
}
