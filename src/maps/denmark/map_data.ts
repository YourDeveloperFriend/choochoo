import z from "zod";
import { DirectionZod } from "../../engine/state/tile";

export const DenmarkMapData = z.object({
  // For towns that connect to a ferry link, what direction connects to what ferry link (as defined by the city on the other side of the link)
  ferryLinks: z
    .object({
      direction: DirectionZod,
      city: z.string(),
    })
    .array()
    .optional(),
});
export type DenmarkMapData = z.infer<typeof DenmarkMapData>;
