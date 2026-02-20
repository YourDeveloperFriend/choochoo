import Sequelize from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { NextFunction, Request, Response } from "express";
import { logError } from "../utils/functions";
import { FeedbackDao } from "./feedback/dao";
import { GameDao } from "./game/dao";
import { GameHistoryDao } from "./game/history_dao";
import { LogDao } from "./messages/log_dao";
import { UserDao } from "./user/dao";
import { postgresUrl, postgresSsl } from "./util/environment";

export const sequelize = new Sequelize({
  dialect: PostgresDialect,
  url: postgresUrl().toString(),
  // logging: log,
  models: [GameDao, UserDao, LogDao, GameHistoryDao, FeedbackDao],
  ssl: postgresSsl(),
});

let connection: Promise<void>;

export function connectToSequelize() {
  return (connection = sequelize.authenticate());
}

export function waitForSequelize() {
  connectToSequelize().catch((err: unknown) => {
    logError("failed to connect to sql database", err);
    process.exit(1);
  });
  return (req: Request, res: Response, next: NextFunction): void => {
    connection.then(() => next(), next);
  };
}
