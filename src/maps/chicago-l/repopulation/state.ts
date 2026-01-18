import z from "zod";
import { Key } from "../../../engine/framework/key";
import { GoodZod } from "../../../engine/state/good";

export const REPOPULATION = new Key("chicagol_repopulation", {
  parse: z.array(GoodZod).parse,
});
