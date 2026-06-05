import z from "zod";

export const MexicoVariantConfig = z.object({
  deterministicActions: z.boolean().optional(),
  redBlackProduction: z.boolean().optional(),
  productionForAll: z.boolean().optional(),
});
export type MexicoVariantConfig = z.infer<typeof MexicoVariantConfig>;
