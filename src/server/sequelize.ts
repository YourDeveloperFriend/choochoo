import Sequelize from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { NextFunction, Request, Response } from "express";
import { logError } from "../utils/functions";
import { FeedbackDao } from "./feedback/dao";
import { GameDao } from "./game/dao";
import { GameHistoryDao } from "./game/history_dao";
import { LogDao } from "./messages/log_dao";
import { UserDao } from "./user/dao";
import { environment } from "./util/environment";

export const sequelize = new Sequelize({
  dialect: PostgresDialect,
  url: environment.postgresUrl.toString(),
  // logging: log,
  models: [GameDao, UserDao, LogDao, GameHistoryDao, FeedbackDao],
});

const connection = sequelize.authenticate();

connection.catch((err: unknown) => {
  logError("failed to connect to sql database", err);
  process.exit();
});

export function waitForSequelize() {
  return (req: Request, res: Response, next: NextFunction): void => {
    connection.then(() => next(), next);
  };
}
