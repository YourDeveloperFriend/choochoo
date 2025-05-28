import z from "zod";

export const ScandinaviaMapData = z.object({
  isCoastal: z.boolean().optional(),
});

export type ScandinaviaMapData = z.infer<typeof ScandinaviaMapData>;
