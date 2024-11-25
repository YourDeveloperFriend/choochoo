
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';

import { Op, WhereOptions } from '@sequelize/core';
import { messageContract } from '../../api/message';
import { reverse } from '../../utils/functions';
import { assert } from '../../utils/validate';
import { GameModel } from '../model/game';
import { LogModel } from '../model/log';
import '../session';
import { emitToRoom } from '../socket';
import { badwords } from '../util/badwords';

export const messageApp = express();

const router = initServer().router(messageContract, {
  async list({ query }) {
    const where: WhereOptions<LogModel> = {};
    // Sequelize gets confused about the null query.
    where.gameId = query.gameId ?? (null as any);
    if (query.pageCursor != null) {
      where.id = {
        [Op.lte]: query.pageCursor,
      };
    }
    const pageSize = 20;
    const modelMessages = await LogModel.findAll({ where, limit: pageSize + 1, order: [['id', 'DESC']] });
    const messages = reverse(modelMessages.map((message) => message.toApi()));
    if (messages.length > pageSize) {
      const [omitted, ...rest] = messages;
      return { status: 200, body: { messages: rest, nextPageCursor: omitted.id } };
    } else {
      return { status: 200, body: { messages } };
    }
  },

  async sendChat({ body: { message, gameId }, req }) {
    for (const badword of badwords) {
      assert(!message.includes(badword), { invalidInput: 'cannot use foul language in message' });
    }
    assert(gameId == null || (await GameModel.findByPk(gameId)) != null, { notFound: true });
    const log = await LogModel.create({ message, gameId, userId: req.session.userId });
    emitToRoom([log]);
    return { status: 200, body: { message: log.toApi() } };
  },
});

createExpressEndpoints(messageContract, router, messageApp);