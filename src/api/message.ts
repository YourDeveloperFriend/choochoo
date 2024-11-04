
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export const SubmitMessageApi = z.object({
  message: z.string(),
  gameId: z.number().optional(),
});

export type SubmitMessageApi = z.infer<typeof MessageApi>;

export const MessageApi = z.object({
  id: z.number(),
  message: z.string(),
  userId: z.number().optional(),
  index: z.number(),
  gameId: z.number().optional(),
  date: z.string().optional(),
});

export type MessageApi = z.infer<typeof MessageApi>;

export const PageCursor = z.object({
  beforeDate: z.string(),
  beforeIndex: z.number(),
});

export type PageCursor = z.infer<typeof PageCursor>;

export const ListMessageApi = z.object({
  gameId: z.coerce.number().optional(),
  pageCursor: PageCursor.optional(),
});


const c = initContract();

export const messageContract = c.router({
  list: {
    method: 'GET',
    path: `/messages/`,
    responses: {
      200: z.object({ messages: z.array(MessageApi), nextPageCursor: PageCursor.optional() }),
    },
    query: ListMessageApi,
    summary: 'Get a list of messages',
  },
  sendChat: {
    method: 'POST',
    path: `/messages/send`,
    responses: {
      200: z.object({ message: MessageApi })
    },
    body: SubmitMessageApi,
  },
});