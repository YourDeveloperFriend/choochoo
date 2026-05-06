import z from "zod";

export const VariantConfig = z.record(z.unknown());
export type VariantConfig = z.infer<typeof VariantConfig>;
