import { isFetchError } from "@ts-rest/react-query/v5";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { ZodError } from "zod";
import { ValidationError, ZodErrorResponse } from "../../api/error";
import { logError } from "../../utils/functions";

interface NetworkError {
  status: number;
  body: unknown;
}

interface ErrorBody {
  error: string;
  code?: number;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error != null &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number" &&
    "body" in error
  );
}

export function isErrorBody(t: unknown): t is ErrorBody {
  return t != null && typeof t === "object" && "error" in t;
}

export function useErrorNotifier(): (error: Error | NetworkError) => void {
  return useCallback(
    (error: Error | NetworkError) => toast.error(toMessage(error)),
    [],
  );
}

export function toValidationError(error: ZodError): ValidationError {
  return Object.fromEntries(
    error.issues.flatMap((issue) => {
      return issue.path.map((_, index, path) => [
        path.slice(0, index + 1).join("."),
        issue.message,
      ]);
    }),
  );
}

export function handleError(
  isPending: boolean,
  error?: Error | NetworkError | null,
): ValidationError | undefined {
  const notify = useErrorNotifier();
  useEffect(() => {
    if (error == null || isPending) {
      return;
    }
    notify(error);
  }, [error]);

  if (isPending || error == null || isFetchError(error)) {
    return undefined;
  }

  const zodError = ZodErrorResponse.safeParse(error.body);
  if (zodError.success) {
    return toValidationError(new ZodError(zodError.data.issues));
  }
  return undefined;
}

function toMessage(error: Error | NetworkError): string {
  if (isFetchError(error) || error.status >= 500) {
    logError("Server error", error);
    return "An unknown error occurred";
  }
  const prefix = toPrefix(error.status);
  if (prefix != null) {
    if (isErrorBody(error.body)) {
      return `${prefix}: ${error.body.error}`;
    }
    return prefix;
  }
  logError("Unknown error", error);
  return "An unknown error occurred";
}

function toPrefix(status: number): string | undefined {
  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    default:
      return undefined;
  }
}
