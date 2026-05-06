import z from "zod";

export const ReversteamVariantConfig = z.object({
  baseRules: z.boolean(),
});
export type ReversteamVariantConfig = z.infer<typeof ReversteamVariantConfig>;
