import { ValidationError } from '@sequelize/core';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import { userContract, UserRole } from '../../api/user';
import { assert } from '../../utils/validate';
import { InvitationModel } from '../model/invitations';
import { UserModel } from '../model/user';
import { sequelize } from '../sequelize';
import '../session';
import { badwords } from '../util/badwords';
import { environment, Stage } from '../util/environment';


export const userApp = express();

const router = initServer().router(userContract, {

  async getMe({ req }) {
    if (typeof req.session.userId === 'string') {
      delete req.session.userId;
    }
    if (req.session.userId == null) {
      return { status: 200, body: { user: undefined } };
    }
    const user = await UserModel.getUser(req.session.userId);

    assert(user != null);
    return { status: 200, body: { user } };
  },

  async list({ query }) {
    const users = await UserModel.findAll({
      where: query,
    });
    return { status: 200, body: { users: users.map((user) => user.toApi()) } };
  },

  async get({ params }) {
    const user = await UserModel.getUser(params.userId);
    assert(user != null, { notFound: true });
    return { status: 200, body: { user: UserModel.toApi(user) } };
  },

  async create({ req, body }) {
    try {
      for (const badword of badwords) {
        assert(!body.username.includes(badword), { invalidInput: 'cannot use bad words in username' });
      }
      const user = await sequelize.transaction(async (transaction) => {
        const [user] = await Promise.all([
          UserModel.register(body, transaction),
          InvitationModel.useInvitationCode(body.invitationCode, transaction),
        ]);
        return user;
      });
      req.session.userId = user.id;
      return { status: 200, body: { user: user.toMyApi() } };
    } catch (e) {
      console.log('error', e);
      if (e instanceof ValidationError) {
        assert(!e.errors[0].message.includes('must be unique'), { invalidInput: e.errors[0].message });
      }
      throw e;
    }
  },

  async login({ req, body }) {
    const user = await UserModel.login(body.usernameOrEmail, body.password);
    assert(user != null && user.role !== UserRole.enum.BLOCKED, { unauthorized: 'Invalid credentials' });
    req.session.userId = user.id;
    return { status: 200, body: { user: user.toMyApi() } };
  },

  async loginBypass({ req, params }) {
    assert(environment.stage === Stage.enum.development, { permissionDenied: true });
    const user = await UserModel.getUser(params.userId);
    assert(user != null, { notFound: true });
    req.session.userId = user.id;
    return { status: 200, body: { user } };
  },

  async createInvite({ body, params, req }) {
    assert(req.session.userId != null, { unauthorized: true });
    const user = await UserModel.getUser(req.session.userId);
    assert(user != null, { unauthorized: true });
    assert(user.role === UserRole.Enum.ADMIN, { permissionDenied: 'not an admin' });
    assert((await UserModel.getUser(params.userId)) != null, { notFound: 'user not found' });
    await InvitationModel.create({
      id: body.code,
      count: body.count,
      userId: params.userId,
    });
    return { status: 200, body: { success: true } };
  },

  async makeAdmin({ params, req }) {
    assert(req.session.userId != null, { unauthorized: true });
    const user = await UserModel.getUser(req.session.userId);
    assert(user != null, { unauthorized: true });
    assert(user.role === UserRole.Enum.ADMIN, { permissionDenied: 'not an admin' });
    const modifyUser = await UserModel.findByPk(params.userId);
    assert(modifyUser != null, { notFound: 'user not found' });
    modifyUser.role = UserRole.enum.ADMIN;
    await modifyUser.save();
    await modifyUser.updateCache();
    return { status: 200, body: { success: true } };
  },

  async logout({ req }) {
    req.session.userId = undefined;
    return { status: 200, body: { success: true } };
  },
});

createExpressEndpoints(userContract, router, userApp);