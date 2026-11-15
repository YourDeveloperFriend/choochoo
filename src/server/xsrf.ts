import { randomBytes } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import { InvalidXsrfToken } from "../utils/error";
import "./session";

export const xsrfApp = express();

xsrfApp.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" || req.method === "OPTIONS") {
    return next();
  }
  const xsrfToken = await getXsrfToken(req);
  if (req.headers["xsrf-token"] !== xsrfToken) {
    return next(new InvalidXsrfToken());
  }
  next();
});

async function getXsrfToken(req: Request): Promise<string> {
  if (req.session.xsrfToken == null) {
    const buffer = await randomBytes(32);
    req.session.xsrfToken = buffer.toString("hex");
  }
  return req.session.xsrfToken;
}

xsrfApp.get("/api/xsrf", (req: Request, res: Response, next: NextFunction) => {
  getXsrfToken(req).then((xsrfToken) => res.json({ xsrfToken }), next);
});
