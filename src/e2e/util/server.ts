import { runApp } from "../../server/server";
import { log } from "../../utils/functions";

export function setUpServer(): void {
  let cb: () => Promise<void>;

  beforeAll(async function turnUpServer() {
    log("start server turnup");
    cb = await runApp();
    log("end server turnup");
  });

  afterAll(async function turnDownServer() {
    log("start server turndown");
    await cb?.();
    log("end server turndown");
  });
}
