import z from "zod";
import { assertNever } from "../../utils/validate";

export enum Dimension {
  HEAVEN,
  EARTH,
  HELL,
}

export function dimensionToString(dimension: Dimension) {
  switch (dimension) {
    case Dimension.HEAVEN:
      return "Heaven";
    case Dimension.EARTH:
      return "Earth";
    case Dimension.HELL:
      return "Hell";
    default:
      assertNever(dimension);
  }
}

export const DimensionZod = z.nativeEnum(Dimension);

export const SoulTrainMapData = z.object({
  topLeft: z.boolean().optional(),
  dimension: DimensionZod.optional(),
});
export type SoulTrainMapData = z.infer<typeof SoulTrainMapData>;
