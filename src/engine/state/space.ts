import { z } from "zod";
import { Immutable } from "../../utils/immutable";
import { Good } from "./good";
import { SpaceType, SpaceTypeZod } from "./location_type";
import { OnRollData } from "./roll";
import { DirectionZod, MutableTileData } from "./tile";
import {SpaceStyleZod} from "./location_style";

export const MutableCityData = z.object({
  type: z.literal(SpaceType.CITY),
  name: z.string(),
  color: z.union([z.array(z.nativeEnum(Good)), z.nativeEnum(Good)]),
  goods: z.array(z.nativeEnum(Good)),
  urbanized: z.boolean().optional(),
  onRoll: z.array(OnRollData),
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

export const MutableLandData = z.object({
  type: LandType,
  townName: z.string().optional(),
  tile: MutableTileData.optional(),
  terrainCost: z.number().optional(),
  goods: z.array(z.number()).optional(),
  unpassableEdges: z.array(DirectionZod).optional(),
  style: SpaceStyleZod.optional(),
  mapSpecific: z.any().optional(),
});

export type MutableLandData = z.infer<typeof MutableLandData>;
export type LandData = Immutable<MutableLandData>;

export const MutableSpaceData = z.union([MutableCityData, MutableLandData]);
export type MutableSpaceData = z.infer<typeof MutableSpaceData>;
export type SpaceData = Immutable<MutableSpaceData>;
