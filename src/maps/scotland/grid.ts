import { SpaceData } from "../../engine/state/space";
import { BLUE, RED, YELLOW } from "../../engine/state/good";
import { Direction } from "../../engine/state/tile";
import { duplicate } from "../../utils/functions";
import {
  bridge,
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  WATER,
  RIVER,
  town,
  UNPASSABLE,
  white,
} from "../factory";
import { startFrom } from "../tile_factory";

export const map = grid<SpaceData>([
    [
      ...duplicate(2, WATER),
      town("Stornoway"),
      ...duplicate(5, WATER),
      bridge({
        tile: {
          ...startFrom(Direction.BOTTOM).curveRight(),
          claimableCost: [6],
          },
      }),
      town("Belfast"),
      UNPASSABLE,
    ],  
    [
      WATER,
      bridge({
        tile: {
          ...startFrom(Direction.BOTTOM_LEFT).curveRight(),
          claimableCost: [6],
          },
      }),
      WATER,
      PLAIN,
      city("Oban", YELLOW,[white(3)]),
      PLAIN,
      RIVER,
      town("Ayr"),
      ...duplicate(2,WATER),
    ],
    [
      ...duplicate(2,WATER),
      town("Ullapool"),
      PLAIN,
      MOUNTAIN,
      // should be mountain river
      MOUNTAIN,
      RIVER,
      city("Belfast", RED, [white(2)]),
      RIVER,
      city("Stanraer", BLUE, [white(6)]),
    ],
    [
      WATER,
      RIVER,
      MOUNTAIN,
      MOUNTAIN,
      // should be mountain river,
      MOUNTAIN,
      PLAIN,
      RIVER,
      MOUNTAIN,
      MOUNTAIN,
      // should be mountain river,
      WATER,
    ],
    [
      WATER,
      PLAIN,
      RIVER,
      town("Inverness"),
      MOUNTAIN,
      RIVER,
      town("Kirkcaldy"),
      RIVER,
      ...duplicate(2,PLAIN),
    ],
    [
      WATER,
      city("Wick",YELLOW,[white(4)]),
      WATER,
      PLAIN,
      MOUNTAIN,
      RIVER,
      WATER,
      city("Edinburgh", RED, [white(1)]),
      PLAIN,
      UNPASSABLE,
    ],
    [
      ...duplicate(3,WATER),
      ...duplicate(2,PLAIN),
      town("Dundee"),
      WATER,
      ...duplicate(3,PLAIN),
    ],
    [
      ...duplicate(3, WATER),
      city("Aberdeen", BLUE, [white(5)]),
      RIVER,
      ...duplicate(2, WATER),
      PLAIN,
      town("Berwick"), 
      UNPASSABLE,
    ],
    [
      ...duplicate(10, WATER),
    ],
]);
