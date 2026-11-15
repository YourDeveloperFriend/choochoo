import {
  ApiFetcherArgs,
  ClientArgs,
  initContract,
  tsRestFetchApi,
} from "@ts-rest/core";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { autoActionContract } from "../../api/auto_action";
import { feedbackContract } from "../../api/feedback";
import { gameContract } from "../../api/game";
import { gameHistoryContract } from "../../api/history";
import { messageContract } from "../../api/message";
import { notesContract } from "../../api/notes";
import { notificationsContract } from "../../api/notifications";
import { userContract } from "../../api/user";
import { ErrorCode } from "../../utils/error_code";
import { environment } from "./environment";
import { isErrorBody, isNetworkError } from "./network";

const c = initContract();

const contract = c.router(
  {
    games: gameContract,
    histories: gameHistoryContract,
    messages: messageContract,
    users: userContract,
    feedback: feedbackContract,
    notifications: notificationsContract,
    autoActions: autoActionContract,
    notes: notesContract,
  },
  {
    validateResponse: true,
    commonResponses: {
      400: c.type<{ error: string }>(),
    },
  },
);

let xsrfToken = generateXsrfToken();

async function generateXsrfToken(): Promise<string> {
  const result = await fetch(`${environment.apiHost}/api/xsrf`, {
    credentials: "include",
  });
  const response = await result.json();
  return response.xsrfToken;
}

const clientArgs: ClientArgs = {
  baseUrl: `${environment.apiHost}/api`,
  baseHeaders: {
    "x-app-source": "ts-rest",
  },
  credentials: "include",
  async api(args: ApiFetcherArgs) {
    const response = await attemptApi(args);
    if (!isNetworkError(response)) {
      return response;
    }
    if (!isErrorBody(response.body)) {
      return response;
    }
    if (response.body.code !== ErrorCode.INVALID_XSRF_TOKEN) {
      return response;
    }

    xsrfToken = generateXsrfToken();
    return attemptApi(args);
  },
};

async function attemptApi(
  args: ApiFetcherArgs,
): Promise<ReturnType<typeof tsRestFetchApi>> {
  args.headers["xsrf-token"] = await xsrfToken;
  return tsRestFetchApi(args);
}

export const tsr = initTsrReactQuery(contract, clientArgs);
