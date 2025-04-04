import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { LandData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import {
  black,
  city,
  grid,
  MOUNTAIN,
  plain,
  PLAIN,
  RIVER,
  town,
  white,
} from "../factory";

const DESERT: LandData = { type: SpaceType.DESERT };

export const map = grid([
  [
    PLAIN,
    PLAIN,
    town("Multan"),
    PLAIN,
    PLAIN,
    PLAIN,
    city("Ahmedabad", RED, white(2), 3),
    RIVER,
  ],
  [
    city("Lahore", YELLOW, white(1), 3),
    PLAIN,
    ...duplicate(4, DESERT),
    RIVER,
    PLAIN,
    city("Bombay", PURPLE, white(3), 3),
    PLAIN,
  ],
  [PLAIN, PLAIN, ...duplicate(4, DESERT), RIVER, ...duplicate(4, PLAIN)],
  [
    town("Ambala"),
    PLAIN,
    DESERT,
    DESERT,
    DESERT,
    PLAIN,
    RIVER,
    town("Jalgaon"),
    PLAIN,
    town("Solapur"),
  ],
  [
    PLAIN,
    PLAIN,
    city("Delhi", YELLOW, black(6), 3),
    RIVER,
    town("Jaipur"),
    PLAIN,
    RIVER,
    ...duplicate(4, PLAIN),
  ],
  [
    PLAIN,
    RIVER,
    RIVER,
    RIVER,
    PLAIN,
    PLAIN,
    PLAIN,
    RIVER,
    PLAIN,
    city("Haiderabad", RED, white(5), 3),
  ],
  [
    MOUNTAIN,
    town("Bareilly"),
    RIVER,
    PLAIN,
    RIVER,
    PLAIN,
    city("Nagpur", RED, white(4), 3),
    PLAIN,
    RIVER,
    PLAIN,
    PLAIN,
  ],
  [
    MOUNTAIN,
    RIVER,
    RIVER,
    city("Cawnpore", BLUE, black(5), 3),
    RIVER,
    PLAIN,
    PLAIN,
    RIVER,
    PLAIN,
    PLAIN,
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    RIVER,
    RIVER,
    town("Jabalpur"),
    PLAIN,
    PLAIN,
    RIVER,
    PLAIN,
    plain({ terrainCost: 6 }),
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    city("Allahabad", BLUE, black(4), 3),
    RIVER,
    PLAIN,
    PLAIN,
    town("Raipur"),
    PLAIN,
    RIVER,
    plain({ terrainCost: 6 }),
    city("Madras", PURPLE, white(6), 3),
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    RIVER,
    ...duplicate(5, PLAIN),
    town("Guntur"),
    plain({ terrainCost: 6 }),
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    city("Benares", BLUE, black(3), 3),
    RIVER,
    RIVER,
    PLAIN,
    RIVER,
    PLAIN,
    PLAIN,
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    RIVER,
    city("Patna", BLUE, black(2), 3),
    RIVER,
    town("Raurkela"),
    RIVER,
    town("Vishakha-putnam"),
  ],
  [MOUNTAIN, MOUNTAIN, PLAIN, RIVER, RIVER, PLAIN, PLAIN, RIVER],
  [MOUNTAIN, town("Darjeeling"), PLAIN, PLAIN, RIVER, RIVER, RIVER],
  [
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    RIVER,
    RIVER,
    city("Calcutta", PURPLE, black(1), 3),
  ],
  [MOUNTAIN, MOUNTAIN, MOUNTAIN, RIVER, town("Dacca"), RIVER],
]);
