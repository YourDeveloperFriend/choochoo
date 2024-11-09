import { URL } from "url";
import { z } from "zod";
import { assert } from "../../utils/validate";

export const Stage = z.enum(['production', 'development']);
export type Stage = z.infer<typeof Stage>;

assert(process.env.POSTGRES_URL != null, 'must provide POSTGRES_URL');
assert(process.env.REDIS_URL != null, 'must provide REDIS_URL');
assert(process.env.SESSION_SECRET != null, 'must provide SESSION_SECRET');

const postgresUrl = new URL(process.env.POSTGRES_URL);
assert(postgresUrl != null, 'must provide POSTGRES_URL in url format');

export const environment = {
  stage: Stage.parse(process.env.NODE_ENV),
  clientOrigin: process.env.CLIENT_ORIGIN,
  postgresUrl,
  redisUrl: new URL(process.env.REDIS_URL),
  port: Number(process.env.PORT ?? 3000),
  cert: process.env.CERT,
  certKey: process.env.CERT_KEY,
  sessionSecret: process.env.SESSION_SECRET,
} as const;

if (environment.stage !== Stage.enum.development) {
  assert(environment.cert != null, 'must provide CERT and CERT_KEY in prod mode')
  assert(environment.port === 443, 'PORT must be 443 in prod mode');
  assert(environment.clientOrigin != null, 'must provide CLIENT_ORIGIN in prd mode');
}