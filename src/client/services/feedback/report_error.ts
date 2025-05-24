import { useCallback, useState } from "react";
import { CreateErrorReportApi } from "../../../api/feedback";
import { assert } from "../../../utils/validate";
import { tsr } from "../client";

let throttleTimestamp: number | undefined;

export function useReportError() {
  const { mutate, isPending } = tsr.feedback.reportError.useMutation();
  const [errorId, setErrorId] = useState<number | undefined>();

  const reportError = useCallback((body: CreateErrorReportApi) => {
    // Only submit a report once every hour
    if (
      throttleTimestamp != null &&
      Date.now() < throttleTimestamp + 1000 * 60 * 60 * 60
    )
      return;
    throttleTimestamp = Date.now();
    mutate(
      { body },
      {
        onSuccess: (body) => {
          assert(body.status === 200);
          setErrorId(body.body.errorId);
        },
      },
    );
  }, []);
  return { reportError, isPending, errorId };
}
