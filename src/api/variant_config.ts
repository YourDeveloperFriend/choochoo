import z from "zod";
import { GameKeyZod } from "./game_key";
import { DIFFICULTY_LEVELS } from "../maps/puerto_rico/difficulty_levels";
import { IRELAND_GAME_KEY } from "../maps/ireland/settings";
import { REVERSTEAM_GAME_KEY } from "../maps/reversteam/settings";
import { CYPRUS_GAME_KEY } from "../maps/cyprus/settings";
import { PUERTO_RICO_GAME_KEY } from "../maps/puerto_rico/settings";

export const IrelandVariantConfig = z.object({
  gameKey: z.literal(IRELAND_GAME_KEY),
  locoVariant: z.boolean(),
});
export type IrelandVariantConfig = z.infer<typeof IrelandVariantConfig>;

export const ReversteamVariantConfig = z.object({
  gameKey: z.literal(REVERSTEAM_GAME_KEY),
  baseRules: z.boolean(),
});
export type ReversteamVariantConfig = z.infer<typeof ReversteamVariantConfig>;

export const CyprusVariantConfig = z.object({
  gameKey: z.literal(CYPRUS_GAME_KEY),
  variant2020: z.boolean().optional(),
});
export type CyprusVariantConfig = z.infer<typeof CyprusVariantConfig>;

export const PuertoRicoVariantConfig = z.object({
  gameKey: z.literal(PUERTO_RICO_GAME_KEY),
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
