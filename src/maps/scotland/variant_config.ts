import z from "zod";

export const ScotlandVariantConfig = z.object({
  smallerBag: z.boolean().optional(),
});
export type ScotlandVariantConfig = z.infer<typeof ScotlandVariantConfig>;
