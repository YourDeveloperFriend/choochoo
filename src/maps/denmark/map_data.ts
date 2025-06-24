import z from "zod";
import { DirectionZod } from "../../engine/state/tile";

export const DenmarkMapData = z.object({
  ferryLinks: z.object({
    direction: DirectionZod,
    city: z.string()
  }).array().optional(),
});
export type DenmarkMapData = z.infer<typeof DenmarkMapData>;
