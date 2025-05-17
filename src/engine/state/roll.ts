import { z } from "zod";
import { CityGroup } from "./city_group";
import { GoodZod } from "./good";

export const OnRoll = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export type OnRoll = z.infer<typeof OnRoll>;

export const OnRollData = z.object({
  onRoll: OnRoll,
  group: z.nativeEnum(CityGroup),
  goods: z.array(z.union([GoodZod, z.null(), z.undefined()])),
});

export type OnRollData = z.infer<typeof OnRollData>;
