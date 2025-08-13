import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { PlayerColorZod } from "./player";
import { DirectionZod } from "./tile";

export const Offset = z.object({
  direction: DirectionZod,
  distance: z.number().optional(),
});
export type Offset = z.infer<typeof Offset>;

export const InterCityConnection = z.object({
  id: z.string(),
  connects: CoordinatesZod.array(),
  connectedTownExit: z.union([
                        DirectionZod,             
                        DirectionZod.array()       
                      ]).optional(),
  cost: z.number(),
  center: CoordinatesZod.optional(),
  offset: Offset.optional(),

  // No owner means the connection isn't built. An owner but no color means it's built but unowned.
  owner: z.object({ color: PlayerColorZod.optional() }).optional(),
});
export type InterCityConnection = z.infer<typeof InterCityConnection>;

export const OwnedInterCityConnection = InterCityConnection.required({
  owner: true,
});
export type OwnedInterCityConnection = z.infer<typeof OwnedInterCityConnection>;
