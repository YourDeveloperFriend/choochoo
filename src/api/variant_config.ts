import z from "zod";
import { GameKey } from "./game_key";

const EmptyVariantConfig = z.object({
  gameKey: z.enum([
    GameKey.SOUTHERN_US,
    GameKey.FOUR_CORNERS,
    GameKey.BARBADOS,
    GameKey.TRISLAND,
    GameKey.PORTUGAL,
    GameKey.AUSTRALIA,
    GameKey.DC_METRO,
    GameKey.BALKAN,
    GameKey.POLAND,
    GameKey.SCANDINAVIA,
    GameKey.NEW_ENGLAND,
    GameKey.SCOTLAND,
    GameKey.ALABAMA_RAILWAYS,
    GameKey.SICILY,
    GameKey.DENMARK,
    GameKey.DETROIT,
    GameKey.GERMANY,
    GameKey.LONDON,
    GameKey.MOON,
    GameKey.INDIA_STEAM_BROTHERS,
    GameKey.KOREA_WALLACE,
    GameKey.MADAGASCAR,
    GameKey.MONTREAL_METRO,
    GameKey.HEAVY_CARDBOARD,
    GameKey.RUST_BELT,
    GameKey.JAMAICA,
    GameKey.PITTSBURGH,
    GameKey.SWEDEN,
    GameKey.DISCO_INFERNO,
    GameKey.SOUL_TRAIN,
    GameKey.ST_LUCIA,
    GameKey.CHESAPEAKE_AND_OHIO,
    GameKey.CALIFORNIA_GOLD_RUSH,
    GameKey.UNION_PACIFIC_EXPRESS,
    GameKey.RUST_BELT_EXPRESS,
    GameKey.CHICAGO_SPEAKEASY,
    GameKey.BELGIUM,
    GameKey.EASTERN_US_AND_CANADA,
    GameKey.DOUBLE_BASE_USA,
  ]),
});
type EmptyVariantConfig = z.infer<typeof EmptyVariantConfig>;

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
  difficulty: z.enum(['novicio', 'estudiante', 'versado', 'maestro', 'conquistador', 'dios']),
});
export type PuertoRicoVariantConfig = z.infer<typeof PuertoRicoVariantConfig>;

export const VariantConfig = z.discriminatedUnion("gameKey", [
  EmptyVariantConfig,
  IrelandVariantConfig,
  ReversteamVariantConfig,
  CyprusVariantConfig,
  PuertoRicoVariantConfig,
]);
export type VariantConfig = z.infer<typeof VariantConfig>;
