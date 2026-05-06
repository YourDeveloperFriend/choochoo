import z from "zod";

export const CyprusVariantConfig = z.object({
  variant2020: z.boolean().optional(),
});
export type CyprusVariantConfig = z.infer<typeof CyprusVariantConfig>;
