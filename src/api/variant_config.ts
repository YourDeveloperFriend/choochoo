import z from "zod";
import { GameKey, GameKeyZod } from "./game_key";
import { DIFFICULTY_LEVELS } from "../maps/puerto_rico/difficulty_levels";

export const IrelandVariantConfig = z.object({
  gameKey: z.literal(GameKey.IRELAND),
  locoVariant: z.boolean(),
});
export type IrelandVariantConfig = z.infer<typeof IrelandVariantConfig>;

export const ReversteamVariantConfig = z.object({
  gameKey: z.literal(GameKey.REVERSTEAM),
  baseRules: z.boolean(),
});
export type ReversteamVariantConfig = z.infer<typeof ReversteamVariantConfig>;

export const CyprusVariantConfig = z.object({
  gameKey: z.literal(GameKey.CYPRUS),
  variant2020: z.boolean().optional(),
});
export type CyprusVariantConfig = z.infer<typeof CyprusVariantConfig>;

export const PuertoRicoVariantConfig = z.object({
  gameKey: z.literal(GameKey.PUERTO_RICO),
  difficulty: z.enum([...DIFFICULTY_LEVELS]),
});
export type PuertoRicoVariantConfig = z.infer<typeof PuertoRicoVariantConfig>;

export const VariantConfig = z.union([
  IrelandVariantConfig,
  ReversteamVariantConfig,
  CyprusVariantConfig,
  PuertoRicoVariantConfig,
  z.object({ gameKey: GameKeyZod }),
]);
export type VariantConfig = z.infer<typeof VariantConfig>;
