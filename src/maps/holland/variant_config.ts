import z from "zod";

export const HollandVariantConfig = z.object({
  windmillVariant: z.boolean().optional(),
});
export type HollandVariantConfig = z.infer<typeof HollandVariantConfig>;
