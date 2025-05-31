import express, { Request, Response } from "express";
import { log } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { environment, Stage } from "../util/environment";

export const testApp = express();

testApp.get("/login-as/:userId", (req: Request, res: Response) => {
  log("Logging in as", req.params.userId);
  const userId = Number(req.params.userId);
  assert(!isNaN(userId), { invalidInput: "user id must be a number" });
  if (environment.stage !== Stage.enum.test) {
    assert(environment.loginIds.includes(userId), {
      unauthorized: "Cannot log in as unauthorized user",
    });
    assert(
      (environment.loginKey?.length ?? 0) > 0 &&
        req.query.loginKey === environment.loginKey,
      {
        unauthorized: "Login key does not match",
      },
    );
  }

  req.session.userId = userId;
  const redirect =
    typeof req.query.redirect == "string" ? req.query.redirect : "/";
  res.redirect(redirect);
});
