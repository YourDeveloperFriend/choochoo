import { logError } from "../utils/functions";
import { runApp } from "./server";

runApp().catch((e) => {
  logError("unknown system error", e);
  process.exit();
});
