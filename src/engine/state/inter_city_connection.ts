import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { PlayerColorZod } from "./player";

export const InterCityConnection = z.object({
  id: z.string(),
  connects: CoordinatesZod.array(),
  cost: z.number(),
  // No owner means the connection isn't built. An owner but no color means it's built but unowned.
  owner: z.object({ color: PlayerColorZod.optional() }).optional(),
});
export type InterCityConnection = z.infer<typeof InterCityConnection>;

export const OwnedInterCityConnection = InterCityConnection.required({
  owner: true,
});
export type OwnedInterCityConnection = z.infer<typeof OwnedInterCityConnection>;
