import { ApiFetcherArgs, initClient, initContract, tsRestFetchApi } from '@ts-rest/core';
import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { gameContract } from '../../api/game';
import { messageContract } from '../../api/message';
import { userContract } from '../../api/user';

const c = initContract();

export const contract = c.router({
  games: gameContract,
  messages: messageContract,
  users: userContract,
}, {
  commonResponses: {
    400: c.type<{ error: string }>(),
  },
});

const xsrfToken = fetch('/api/xsrf').then((r) => r.json()).then(({ xsrf }) => xsrf);

export const clientArgs = {
  baseUrl: '/api',
  baseHeaders: {
    'x-app-source': 'ts-rest',
  },
  async api(args: ApiFetcherArgs) {
    args.headers['xsrf-token'] = await xsrfToken;
    return tsRestFetchApi(args);
  }
};

export const networkClient = initClient(contract, clientArgs);

export const tsr = initTsrReactQuery(contract, clientArgs);