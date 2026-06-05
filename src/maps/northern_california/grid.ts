import z from "zod";
import { WHITE } from "../../engine/state/city_group";
import { BLUE, GoodZod, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { CityData, SpaceData } from "../../engine/state/space";
import {
  black,
  bridge,
  city,
  customCity,
  grid,
  MOUNTAIN,
  PLAIN,
  town,
  UNPASSABLE,
  WATER,
} from "../factory";
import { startFrom } from "../tile_factory";
import { Direction } from "../../engine/state/tile";

export const NorthernCaliforniaMapData = z.object({
  shipQueue: z.array(GoodZod).optional(),
  isSacramento: z.boolean().optional(),
  isSanJose: z.boolean().optional(),
});
export type NorthernCaliforniaMapData = z.infer<
  typeof NorthernCaliforniaMapData
>;

const SAN_JOSE: CityData = customCity({
  name: "San Jose",
  color: [RED],
  onRoll: [
    { group: WHITE, onRoll: 1, goods: [] },
    { group: WHITE, onRoll: 2, goods: [] },
  ],
  goods: [],
  startingNumCubes: 0,
  mapSpecific: { isSanJose: true } satisfies NorthernCaliforniaMapData,
});

const EAST_SAN_JOSE: CityData = customCity({
  name: "East San Jose",
  color: [RED],
  onRoll: [
    { group: WHITE, onRoll: 3, goods: [] },
    { group: WHITE, onRoll: 4, goods: [] },
  ],
  goods: [],
  startingNumCubes: 0,
  mapSpecific: { isSanJose: true } satisfies NorthernCaliforniaMapData,
});

const SOUTH_SAN_JOSE: CityData = customCity({
  name: "South San Jose",
  color: [RED],
  onRoll: [
    { group: WHITE, onRoll: 5, goods: [] },
    { group: WHITE, onRoll: 6, goods: [] },
  ],
  goods: [],
  startingNumCubes: 0,
  mapSpecific: { isSanJose: true } satisfies NorthernCaliforniaMapData,
});

const SANTA_CRUZ: CityData = customCity({
  name: "Santa Cruz",
  color: [RED],
  onRoll: [],
  goods: [],
  startingNumCubes: 2,
  mapSpecific: { shipQueue: [] } satisfies NorthernCaliforniaMapData,
});

const TO_SACRAMENTO: CityData = customCity({
  name: "to Sacramento",
  color: [],
  onRoll: [],
  goods: [],
  startingNumCubes: 3,
  mapSpecific: { isSacramento: true } satisfies NorthernCaliforniaMapData,
});

export const map = grid<SpaceData>([
  // Col 0 — Pacific coast / far west
  [
    UNPASSABLE,
    WATER,
    city("San Francisco", PURPLE, black(1), 3),
    PLAIN,
    PLAIN,
    MOUNTAIN,
    city("Half Moon Bay", YELLOW, black(4), 1),
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
  ],
  // Col 1 — North coast
  [
    WATER,
    bridge({
      tile: startFrom(Direction.BOTTOM_LEFT).straightAcross(),
    }),
    PLAIN,
    town("Burlingame"),
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
    WATER,
  ],
  // Col 2
  [
    UNPASSABLE,
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_LEFT).curveRight(),
        claimableCost: [10],
      },
    }),
    WATER,
    WATER,
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    WATER,
    WATER,
    WATER,
    WATER,
  ],
  // Col 3
  [
    WATER,
    bridge({
      tile: startFrom(Direction.TOP_LEFT).curveLeft(),
    }),
    WATER,
    WATER,
    bridge({
      tile: startFrom(Direction.BOTTOM).curveRight(),
    }),
    town("Foster City"),
    PLAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    SANTA_CRUZ,
  ],
  // Col 4
  [
    UNPASSABLE,
    bridge({
      tile: startFrom(Direction.BOTTOM_LEFT).straightAcross(),
    }),
    WATER,
    WATER,
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_LEFT).straightAcross(),
        claimableCost: [6],
      },
    }),
    WATER,
    PLAIN,
    town("Los Altos"),
    PLAIN,
    town("Cupertino"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ],
  // Col 5
  [
    city("Oakland", BLUE, black(2), 2),
    PLAIN,
    WATER,
    bridge({
      tile: startFrom(Direction.BOTTOM_LEFT).straightAcross(),
    }),
    WATER,
    WATER,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Saratoga"),
    MOUNTAIN,
    MOUNTAIN,
    town("Scotts Valley"),
    MOUNTAIN,
  ],
  // Col 6
  [
    UNPASSABLE,
    PLAIN,
    PLAIN,
    town("Hayward"),
    WATER,
    WATER,
    WATER,
    PLAIN,
    city("Mountain View", YELLOW, black(3), 1),
    PLAIN,
    PLAIN,
    PLAIN,
    town("Los Gatos"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ],
  // Col 7
  [
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    WATER,
    WATER,
    PLAIN,
    PLAIN,
    town("Santa Clara"),
    PLAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ],
  // Col 8
  [
    UNPASSABLE,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    city("Fremont", YELLOW, black(5), 1),
    PLAIN,
    WATER,
    WATER,
    town("Sunnyvale"),
    PLAIN,
    PLAIN,
    town("Campbell"),
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ],
  // Col 9 — Eastern edge
  [
    MOUNTAIN,
    town("Dublin"),
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Almaden"),
    MOUNTAIN,
    MOUNTAIN,
  ],
  [
    UNPASSABLE,
    MOUNTAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    town("Milpitas"),
    PLAIN,
    PLAIN,
    PLAIN,
    SAN_JOSE,
    SOUTH_SAN_JOSE,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ],
  [
    MOUNTAIN,
    PLAIN,
    town("Pleasanton"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    EAST_SAN_JOSE,
    MOUNTAIN,
    PLAIN,
    town("Morgan MOUNTAIN"),
    PLAIN,
  ],
  [
    UNPASSABLE,
    TO_SACRAMENTO,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Silver Creek"),
    MOUNTAIN,
    MOUNTAIN,
    city("Gilroy", YELLOW, black(6), 1),
  ],
]);

export function isSacramento(data: SpaceData | undefined): boolean {
  if (data == null) return false;
  if (data.type !== SpaceType.CITY) return false;
  return (
    (data.mapSpecific as NorthernCaliforniaMapData | undefined)
      ?.isSacramento === true
  );
}

export function isSanJose(data: SpaceData | undefined): boolean {
  if (data == null) return false;
  if (data.type !== SpaceType.CITY) return false;
  return (
    (data.mapSpecific as NorthernCaliforniaMapData | undefined)?.isSanJose ===
    true
  );
}
