import express, { NextFunction, Request, Response } from "express";
import { UserRole } from "../../api/user";
import { log } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { GameDao } from "../game/dao";
import { UserDao } from "../user/dao";
import { loginBypass, stage, Stage } from "../util/environment";

export const testApp = express();

/**
 * Refuses the request outside the test stage.
 *
 * Stricter than the check /login-as uses, which production allows with a key so
 * the prober can sign in. Nothing below has any business running against real
 * data, so there is no key that opens it.
 */
function testStageOnly(_: Request, __: Response, next: NextFunction): void {
  assert(stage() === Stage.enum.test, { notFound: true });
  next();
}

testApp.get("/login-as/:userId", (req: Request, res: Response) => {
  log("Logging in as", req.params.userId);
  const userId = Number(req.params.userId);
  assert(!isNaN(userId), { invalidInput: "user id must be a number" });
  if (stage() !== Stage.enum.test) {
    const { loginIds, loginKey } = loginBypass();
    assert(loginIds.includes(userId), {
      unauthorized: "Cannot log in as unauthorized user",
    });
    assert((loginKey?.length ?? 0) > 0 && req.query.loginKey === loginKey, {
      unauthorized: "Login key does not match",
    });
  }

  req.session.userId = userId;
  const redirect =
    typeof req.query.redirect == "string" ? req.query.redirect : "/";
  res.redirect(redirect);
});

/**
 * The users the end-to-end specs play as.
 *
 * They exist here, on the server, rather than being inserted by the specs
 * themselves. Two reasons: the specs then depend only on the app's own HTTP
 * surface, which is the thing that is meant to stay still while internals move;
 * and Playwright's TypeScript transform mangles the decorators the models are
 * declared with, so a spec that imports a DAO writes nulls.
 *
 * Reused across runs rather than created per run, so a shared database does not
 * fill up with users and a failure can still be looked into afterwards.
 */
const E2E_USERNAMES = [
  "e2e_one",
  "e2e_two",
  "e2e_three",
  "e2e_four",
  "e2e_five",
];

testApp.get(
  "/test/seed-users",
  testStageOnly,
  (req: Request, res: Response, next: NextFunction) => {
    const count = Number(req.query.count ?? 2);
    assert(Number.isInteger(count) && count > 0, {
      invalidInput: "count must be a positive integer",
    });
    assert(count <= E2E_USERNAMES.length, {
      invalidInput: `only ${E2E_USERNAMES.length} e2e users are defined`,
    });

    seedUsers(count).then((users) => res.json({ users }), next);
  },
);

async function seedUsers(
  count: number,
): Promise<Array<{ id: number; username: string }>> {
  const users = [];
  for (const username of E2E_USERNAMES.slice(0, count)) {
    const [user] = await UserDao.findOrCreate({
      where: { username },
      defaults: {
        username,
        email: `${username}@example.com`,
        // Specs sign in through /login-as, which sets the session directly, so
        // there is deliberately no usable password.
        password: "",
        role: UserRole.enum.USER,
        notificationPreferences: { turnNotifications: [], marketing: false },
        // Left empty on purpose: a colour preference decides who gets which
        // colour at start, which a spec should not depend on.
        preferredColors: [],
        abandons: 0,
        karma: 75,
      },
    });
    users.push({ id: user.id, username: user.username });
  }
  return users;
}

/**
 * Removes a game a spec created.
 *
 * The ordinary delete endpoint refuses a started game unless the caller is an
 * admin, and making the test users admins would have them see a different site
 * than the one being tested.
 */
testApp.delete(
  "/test/games/:gameId",
  testStageOnly,
  (req: Request, res: Response, next: NextFunction) => {
    const gameId = Number(req.params.gameId);
    assert(!isNaN(gameId), { invalidInput: "game id must be a number" });
    GameDao.destroy({ where: { id: gameId }, force: true }).then(
      () => res.json({ success: true }),
      next,
    );
  },
);
