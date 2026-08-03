import { DatabaseError } from "@sequelize/core";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { UserError } from "../utils/error";
import { log, logError } from "../utils/functions";
import { devApp } from "./dev/routes";
import { feedbackApp } from "./feedback/routes";
import { autoActionApp } from "./game/auto_action_routes";
import { gameExportApp } from "./game/export_routes";
import { gameHistoryApp } from "./game/history_routes";
import { notesApp } from "./game/notes_routes";
import { gameApp } from "./game/routes";
import { messageApp } from "./messages/routes";
import { redisApp } from "./redis";
import { waitForSequelize } from "./sequelize";
import { startIo } from "./socket";
import { testApp } from "./test/routes";
import { notificationApp } from "./user/notification_routes";
import { userApp } from "./user/routes";
import { enforceRoleMiddleware } from "./util/enforce_role";
import { clientOrigin, port, stage, Stage } from "./util/environment";
import { Lifecycle } from "./util/lifecycle";
import { xsrfApp } from "./xsrf";

export async function runApp(): Promise<() => Promise<void>> {
  const app = express();

  app.use(cookieParser());
  app.use(redisApp());
  const origin = clientOrigin();
  if (origin) {
    app.use(
      cors({
        credentials: true,
        origin,
      }),
    );
  }
  app.use(xsrfApp);
  app.use(express.json());
  app.use(waitForSequelize());
  app.use(testApp);

  if (stage() !== Stage.enum.production) {
    app.use(devApp());
  }

  app.use("/api", userApp);
  app.use("/api", notificationApp);
  app.use(enforceRoleMiddleware());
  app.use("/api", gameApp);
  app.use("/api", gameHistoryApp);
  app.use("/api", gameExportApp);
  app.use("/api", messageApp);
  app.use("/api", feedbackApp);
  app.use("/api", notesApp);
  app.use("/api", autoActionApp);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err instanceof UserError) {
      res.status(err.statusCode);
      res.json({ success: false, error: err.message, code: err.errorCode });
    } else {
      if (err instanceof DatabaseError) {
        logError("database error", err, err.parameters, err.cause);
      } else {
        logError(
          "error handling request",
          err,
          req.path,
          req.params,
          req.query,
          req.body && JSON.stringify(req.body),
        );
      }
      res.status(500);
      res.json({ success: false });
    }
  });

  const server = createServer(app);

  const io = startIo();

  io.attach(server);

  /// Start
  server.listen(port(), () => {
    log(`AoS listening on port ${port()}, running...`);
  });

  Lifecycle.singleton.start();

  return () =>
    new Promise((resolve, reject) =>
      io.close((err) => {
        if (err != null) {
          reject(err);
        } else {
          resolve();
        }
      }),
    );
}
