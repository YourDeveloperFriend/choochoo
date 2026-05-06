import z from "zod";
import { DIFFICULTY_LEVELS } from "./difficulty_levels";

export const PuertoRicoVariantConfig = z.object({
  difficulty: z.enum([...DIFFICULTY_LEVELS]),
});
export type PuertoRicoVariantConfig = z.infer<typeof PuertoRicoVariantConfig>;
