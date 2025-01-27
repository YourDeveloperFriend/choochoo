import z from "zod";
import { GameKey } from "./game_key";

export const EmptyVariantConfig = z.object({
  gameKey: z.enum([
    GameKey.CYPRUS,
    GameKey.DETROIT,
    GameKey.GERMANY,
    GameKey.INDIA,
    GameKey.KOREA,
    GameKey.MADAGASCAR,
    GameKey.MONTREAL_METRO,
    GameKey.REVERSTEAM,
    GameKey.RUST_BELT,
    GameKey.SWEDEN,
  ]),
});
export type EmptyVariantConfig = z.infer<typeof EmptyVariantConfig>;

export const IrelandVariantConfig = z.object({
  gameKey: z.literal(GameKey.IRELAND),
  locoVariant: z.boolean(),
});
export type IrelandVariantConfig = z.infer<typeof IrelandVariantConfig>;

export const VariantConfig = z.discriminatedUnion("gameKey", [
  EmptyVariantConfig,
  IrelandVariantConfig,
]);
export type VariantConfig = z.infer<typeof VariantConfig>;
