import z from "zod";

export const IrelandVariantConfig = z.object({
  locoVariant: z.boolean(),
});
export type IrelandVariantConfig = z.infer<typeof IrelandVariantConfig>;
