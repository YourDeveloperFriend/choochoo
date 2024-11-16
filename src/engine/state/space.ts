import { z } from "zod";
import { Immutable } from "../../utils/immutable";
import { CityGroup } from "./city_group";
import { Good } from "./good";
import { LocationType } from "./location_type";
import { OnRoll } from "./roll";
import { MutableTileData } from "./tile";


export const MutableCityData = z.object({
  type: z.literal(LocationType.CITY),
  name: z.string(),
  color: z.nativeEnum(Good),
  goods: z.array(z.nativeEnum(Good)),
  upcomingGoods: z.array(z.array(z.nativeEnum(Good))),
  urbanized: z.boolean().optional(),
  onRoll: z.array(OnRoll),
  group: z.nativeEnum(CityGroup),
});

export type MutableCityData = z.infer<typeof MutableCityData>;
export type CityData = Immutable<MutableCityData>;

export const MutableLocationData = z.object({
  type: z.union([z.literal(LocationType.PLAIN), z.literal(LocationType.RIVER), z.literal(LocationType.MOUNTAIN), z.literal(LocationType.SWAMP)]),
  townName: z.string().optional(),
  tile: MutableTileData.optional(),
});

export type MutableLocationData = z.infer<typeof MutableLocationData>;
export type LocationData = Immutable<MutableLocationData>;

export const MutableSpaceData = z.discriminatedUnion('type', [MutableCityData, MutableLocationData]);
export type MutableSpaceData = z.infer<typeof MutableSpaceData>;
export type SpaceData = Immutable<MutableSpaceData>;