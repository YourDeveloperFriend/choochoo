import { Op, ValidationError, WhereOptions } from "@sequelize/core";
import { createExpressEndpoints, initServer } from "@ts-rest/express";
import express from "express";
import { userContract, UserRole } from "../../api/user";
import { logError } from "../../utils/functions";
import { pageCursorToString, parsePageCursor } from "../../utils/page_cursor";
import { assert, fail } from "../../utils/validate";
import "../session";
import { emailService } from "../util/email";
import { assertRole } from "../util/enforce_role";
import { UserDao } from "./dao";

export const userApp = express();

const router = initServer().router(userContract, {
  async getMe({ req }) {
    if (typeof req.session.userId === "string") {
      delete req.session.userId;
    }
    if (req.session.userId == null) {
      return { status: 200, body: { user: undefined } };
    }
    const [user, adminUser] = await Promise.all([
      UserDao.getUser(req.session.userId),
      req.session.adminUserId != null
        ? UserDao.getUser(req.session.adminUserId)
        : undefined,
    ]);

    assert(user != null);
    return { status: 200, body: { user, adminUser } };
  },

  async forgotPassword({ body }) {
    const user = await UserDao.findByUsernameOrEmail(body.usernameOrEmail);
    if (user != null) {
      emailService.sendForgotPasswordMessage(user.email);
    }
    return { status: 200, body: { success: true } };
  },

  async updateMe({ body, req }) {
    const userId = req.session.userId;
    assert(userId != null, { unauthorized: "must be signed in" });
    const user = await UserDao.findByPk(userId);
    assert(user != null, { unauthorized: "must be logged in" });
    assert(body.user.id === user.id, { permissionDenied: "cannot change id" });
    assert(body.user.role === user.role, {
      permissionDenied: "cannot change role",
    });

    user.preferredColors = body.user.preferredColors ?? null;
    user.email = body.user.email;
    user.username = body.user.username;
    await user.save();
    await user.updateCache();

    return { status: 200, body: { user: user.toMyApi() } };
  },

  async updatePassword({ body, req }) {
    let user: UserDao | null;
    if (body.updateCode != null) {
      const email = emailService.getEmailFromActivationCode(body.updateCode);
      assert(email != null, { invalidInput: "Expired activation code (1)" });
      user = await UserDao.findByUsernameOrEmail(email);
      assert(user != null, { invalidInput: "Expired activation code (2)" });
    } else if (body.oldPassword != null) {
      assert(req.session.userId != null, { unauthorized: true });
      user = await UserDao.findByPk(req.session.userId);
      assert(user != null);
      assert(await user.comparePassword(body.oldPassword), {
        permissionDenied: "Invalid credentials",
      });
    } else {
      fail({ invalidInput: true });
    }
    user.password = await UserDao.hashPassword(body.newPassword);
    await user.save();
    return { status: 200, body: { success: true } };
  },

  async list({ req, query }) {
    await assertRole(req, UserRole.enum.ADMIN);
    const where: WhereOptions<UserDao> = {};
    const pageCursor = parsePageCursor(query.pageCursor);
    if (pageCursor != null) {
      where.id = { [Op.notIn]: pageCursor };
    }
    if (query.search != null && query.search.trim() !== "") {
      where.username = { [Op.like]: query.search.toLowerCase().trim() };
    }
    const pageSize = query.pageSize ?? 20;
    const allUsers = await UserDao.findAll({
      order: [["id", "DESC"]],
      limit: pageSize + 1,
      where,
    });
    const users =
      allUsers.length > pageSize ? allUsers.slice(0, pageSize) : allUsers;
    const nextPageCursor =
      allUsers.length > pageSize
        ? (pageCursor ?? []).concat(users.map((user) => user.id))
        : undefined;
    return {
      status: 200,
      body: {
        users: users.map((user) => user.toMyApi()),
        nextPageCursor: pageCursorToString(nextPageCursor),
      },
    };
  },

  async get({ req, params }) {
    await assertRole(req);
    const user = await UserDao.getUser(params.userId);
    assert(user != null, { notFound: true });
    return { status: 200, body: { user: UserDao.toApi(user) } };
  },

  async create({ req, body }) {
    try {
      const user = await UserDao.register(body);
      req.session.userId = user.id;
      // Don't await this, just let it go.
      emailService.sendActivationCode(user.email);
      return { status: 200, body: { user: user.toMyApi() } };
    } catch (e) {
      logError("failed to send activation code", e);
      if (e instanceof ValidationError) {
        assert(!e.errors[0].message.includes("must be unique"), {
          invalidInput: e.errors[0].message,
        });
      }
      throw e;
    }
  },

  async activateAccount({ req, body }) {
    assert(req.session.userId != null, { invalidInput: "Sign in first" });
    const user = await UserDao.findByPk(req.session.userId);

    assert(user != null, { unauthorized: "Sign in first" });
    const email = emailService.getEmailFromActivationCode(body.activationCode);
    assert(user.email == email, {
      invalidInput: "Invalid activation code (1)",
    });
    assert(user.role == UserRole.enum.ACTIVATE_EMAIL, {
      invalidInput: "Already activated",
    });

    user.role = UserRole.enum.USER;
    await user.save();
    await user.updateCache();

    return { status: 200, body: { user: user.toMyApi() } };
  },

  async resendActivationCode({ req, body }) {
    assert(req.session.userId != null, { permissionDenied: true });
    if (body.userId != null) {
      await assertRole(req, UserRole.enum.ADMIN);
    }
    const user = await UserDao.findByPk(body.userId ?? req.session.userId);
    assert(user != null, { permissionDenied: true });
    assert(user.role == UserRole.enum.ACTIVATE_EMAIL, {
      permissionDenied: true,
    });
    emailService.sendActivationCode(user.email);
    return { status: 200, body: { success: true } };
  },

  async login({ req, body }) {
    const user = await UserDao.login(body.usernameOrEmail, body.password);
    assert(user != null && user.role !== UserRole.enum.BLOCKED, {
      unauthorized: "Invalid credentials",
    });
    if (body.activationCode != null) {
      const email = emailService.getEmailFromActivationCode(
        body.activationCode,
      );
      if (email == user.email && user.role == UserRole.enum.ACTIVATE_EMAIL) {
        user.role = UserRole.enum.USER;
        await user.save();
        await user.updateCache();
      }
    }
    req.session.userId = user.id;
    return { status: 200, body: { user: user.toMyApi() } };
  },

  async loginBypass({ req, params }) {
    const adminUserId = req.session.adminUserId ?? req.session.userId;
    await assertRole(req, UserRole.enum.ADMIN);

    const [user, adminUser] = await Promise.all([
      UserDao.getUser(params.userId),
      UserDao.getUser(adminUserId!),
    ]);
    assert(user != null, { notFound: true });
    assert(adminUser != null, { notFound: true });

    req.session.userId = user.id;
    req.session.adminUserId = adminUserId;

    return { status: 200, body: { user, adminUser } };
  },

  async subscribe({ body }) {
    await emailService.subscribe(body.email);
    return { status: 200, body: { success: true } };
  },

  async makeAdmin({ params, req }) {
    await assertRole(req, UserRole.enum.ADMIN);
    const modifyUser = await UserDao.findByPk(params.userId);
    assert(modifyUser != null, { notFound: "user not found" });
    modifyUser.role = UserRole.enum.ADMIN;
    await modifyUser.save();
    await modifyUser.updateCache();
    return { status: 200, body: { success: true } };
  },

  async logout({ req }) {
    req.session.userId = undefined;
    req.session.adminUserId = undefined;
    return { status: 200, body: { success: true } };
  },
});

createExpressEndpoints(userContract, router, userApp);
