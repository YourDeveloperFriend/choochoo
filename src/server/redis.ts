import RedisStore from "connect-redis";
import express from "express";
import session from "express-session";
import { Redis } from "ioredis";
import { logError } from "../utils/functions";
import { environment } from "./util/environment";

export const redisClient = new Redis({
  host: environment.redisUrl.hostname,
  port: Number(environment.redisUrl.port),
  username: environment.redisUrl.username,
  password: environment.redisUrl.password,
});
export const subClient = redisClient.duplicate();

redisClient.on("error", (e) => {
  logError("redis connection error", e);
  process.exit();
});

const redisPrefix = environment.redisUrl.pathname.slice(1);

const redisStore = new RedisStore({
  client: redisClient,
  prefix: `${redisPrefix == "" ? "choo" : redisPrefix}:`,
});

export const redisSession = express();

const sessionParser = session({
  store: redisStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  secret: environment.sessionSecret,
});

redisSession.use(sessionParser);
