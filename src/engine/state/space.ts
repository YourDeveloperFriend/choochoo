import { z } from "zod";
import { Immutable } from "../../utils/immutable";
import { CityGroup } from "./city_group";
import { Good, GoodZod } from "./good";
import { SpaceStyleZod } from "./location_style";
import { SpaceType, SpaceTypeZod } from "./location_type";
import { OnRollData } from "./roll";
import { DirectionZod, MutableTileData } from "./tile";

export const MutableCityData = z.object({
  type: z.literal(SpaceType.CITY),
  name: z.string(),
  color: z.union([z.array(z.nativeEnum(Good)), z.nativeEnum(Good)]),
  goods: z.array(z.nativeEnum(Good)),
  urbanized: z.boolean().optional(),
  onRoll: z.array(OnRollData),
  // The goods-growth group color, for cities that display a group color but have no on-roll.
  // Ignored when onRoll is non-empty, and defaults to WHITE.
  group: z.nativeEnum(CityGroup).optional(),
  mapSpecific: z.any().optional(),
  sameCity: z.number().optional(),
  startingNumCubes: z.number().optional(),
  startingNumCubesPerPlayer: z.number().optional(),
});

export type MutableCityData = z.infer<typeof MutableCityData>;
export type CityData = Immutable<MutableCityData>;

export const LandType = SpaceTypeZod.refine(isLandType);
export type LandType = Exclude<SpaceType, SpaceType.CITY>;

function isLandType(value: SpaceType): value is LandType {
  return value !== SpaceType.CITY;
}

export function isUnpassable(
  value: SpaceType,
): value is SpaceType.UNPASSABLE | SpaceType.WATER {
  return value === SpaceType.UNPASSABLE || value === SpaceType.WATER;
}

export const MutableLandData = z.object({
  type: LandType,
  townName: z.string().optional(),
  tile: MutableTileData.optional(),
  terrainCost: z.number().optional(),
  goods: z.array(GoodZod).optional(),
  unpassableEdges: z.array(DirectionZod).optional(),
  style: SpaceStyleZod.optional(),
  mapSpecific: z.any().optional(),
});

export type MutableLandData = z.infer<typeof MutableLandData>;
export type LandData = Immutable<MutableLandData>;

export const MutableSpaceData = z.union([MutableCityData, MutableLandData]);
export type MutableSpaceData = z.infer<typeof MutableSpaceData>;
export type SpaceData = Immutable<MutableSpaceData>;

/**
 * Parses one space, dispatching on `type` instead of trying both members.
 *
 * `MutableSpaceData.parse` tries city first and, for the land spaces that make up
 * most of a grid, builds and discards a ZodError before falling through -- which
 * made error construction the single largest cost of parsing a grid. Dispatching
 * skips that; a malformed space now reports against the shape it claims to be,
 * rather than as a union of two failures.
 *
 * Not expressed as `z.discriminatedUnion`, which requires a literal or enum
 * discriminator: MutableLandData's is `SpaceTypeZod.refine(isLandType)`.
 */
export function parseSpaceData(value: unknown): MutableSpaceData {
  const type = (value as { type?: unknown } | null | undefined)?.type;
  return type === SpaceType.CITY
    ? MutableCityData.parse(value)
    : MutableLandData.parse(value);
}
