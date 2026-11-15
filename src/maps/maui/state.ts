import z from "zod";
import { Key } from "../../engine/framework/key";
import { GoodZod } from "../../engine/state/good";

/**
 * The cubes above the turn track, indexed by turn number minus one. Turn 1 has no cube, and the
 * cubes for turns 2-4 are placed in Hāna during that turn's Goods Growth, after which the slot
 * becomes null.
 */
export const TURN_TRACK_CUBES = new Key("mauiTurnTrackCubes", {
  parse: z.array(GoodZod.nullable()).parse,
});
