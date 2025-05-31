import { z } from "zod";
import { assert } from "../../utils/validate";

export const Stage = z.enum(["production", "development", "test"]);
export type Stage = z.infer<typeof Stage>;

export const environment = {
  stage: Stage.parse(process.env.NODE_ENV),
  apiHost: process.env.API_HOST ?? "",
  socketHost: process.env.SOCKET_HOST ?? window.location.host,
};

assert(
  environment.stage !== Stage.enum.production || environment.apiHost != "",
  "must provide API_HOST in non-development mode",
);

assert(
  environment.stage !== Stage.enum.production ||
    environment.socketHost != window.location.host,
  "must provide SOCKET_HOST in non-development mode",
);
