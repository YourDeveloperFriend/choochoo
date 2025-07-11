import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import { join } from "path";
import { buildApp } from "../../scripts/client_build";

export function devApp() {
  const buildPromise = buildApp({ watch: true });

  const devApp = express();

  devApp.use("/dist/*", (_: Request, __: Response, next: NextFunction) => {
    return buildPromise
      .then(() => {
        next();
      })
      .catch(next);
  });

  devApp.get("/favicon.ico", (_: Request, res: Response) => {
    res.setHeader("content-type", "image/x-icon");
    res.setHeader("content-encoding", "gzip");
    fs.createReadStream(join(__dirname, "../../../favicon.ico")).pipe(res);
  });

  devApp.use("/dist", express.static(join(__dirname, "../../../dist")));
  devApp.use("/static", express.static(join(__dirname, "../../../static")));

  const otherApps = ["/dist", "/js", "/api", "/favicon", "/static"];

  devApp.get("/*", (req: Request, res: Response, next: NextFunction) => {
    const otherApp = otherApps.find((other) => req.path.startsWith(other));
    if (otherApp != undefined) {
      next();
      return;
    }
    res.setHeader("content-type", "text/html");
    fs.createReadStream(join(__dirname, "../../client/index.dev.html")).pipe(
      res,
    );
  });

  return devApp;
}
