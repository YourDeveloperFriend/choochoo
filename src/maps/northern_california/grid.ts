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
  HILL,
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
    HILL,
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
    HILL,
    HILL,
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
    HILL,
    HILL,
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
    HILL,
    HILL,
    HILL,
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
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
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
    HILL,
    HILL,
    town("Scotts Valley"),
    HILL,
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
    HILL,
    HILL,
    HILL,
  ],
  // Col 7
  [
    HILL,
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
    HILL,
    HILL,
    HILL,
  ],
  // Col 8
  [
    UNPASSABLE,
    HILL,
    HILL,
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
    HILL,
    HILL,
    HILL,
  ],
  // Col 9 — Eastern edge
  [
    HILL,
    town("Dublin"),
    HILL,
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
    HILL,
    HILL,
  ],
  [
    UNPASSABLE,
    HILL,
    PLAIN,
    HILL,
    HILL,
    PLAIN,
    town("Milpitas"),
    PLAIN,
    PLAIN,
    PLAIN,
    SAN_JOSE,
    SOUTH_SAN_JOSE,
    PLAIN,
    HILL,
    HILL,
    HILL,
  ],
  [
    HILL,
    PLAIN,
    town("Pleasanton"),
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    EAST_SAN_JOSE,
    HILL,
    PLAIN,
    town("Morgan Hill"),
    PLAIN,
  ],
  [
    UNPASSABLE,
    TO_SACRAMENTO,
    PLAIN,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    town("Silver Creek"),
    HILL,
    HILL,
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
