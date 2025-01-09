import z from "zod";
import { DirectionZod } from "./tile";

export enum TextureType {
  RIVER = 1,
}

export const TextureTypeZod = z.nativeEnum(TextureType);

export const RiverTexture = z.object({
  type: z.literal(TextureType.RIVER),
  exits: DirectionZod.array(),
});
export type RiverTexture = z.infer<typeof RiverTexture>;

export const Texture = z.discriminatedUnion('type', [RiverTexture]);
export type Texture = z.infer<typeof Texture>;
