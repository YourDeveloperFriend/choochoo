import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { SpaceData } from "../../engine/state/space";
import { duplicate, iterate } from "../../utils/functions";
import {
  black,
  city,
  MOUNTAIN,
  PLAIN,
  RIVER,
  startsLowerGrid,
  town,
  white,
} from "../factory";

export const map = startsLowerGrid<SpaceData>([
  [
    city("East Falls Church", BLUE, white(2), 4),
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city(
      "National Airport",
      RED,
      [white(1)].concat(iterate(6, (i) => black((i + 1) as OnRoll))),
    ),
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    town("Arlington Cemetery"),
    PLAIN,
    town("Pentagon"),
    RIVER,
    RIVER,
  ],
  [...duplicate(6, RIVER)],
  [RIVER, town("Foggy Bottom"), RIVER, RIVER, RIVER, RIVER, PLAIN],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    city("L'Enfant Plaza", YELLOW, white(3), 4),
    PLAIN,
    RIVER,
  ],
  [
    PLAIN,
    PLAIN,
    city("Metro Center", PURPLE, white(4), 4),
    PLAIN,
    PLAIN,
    RIVER,
    town("Anacostia"),
  ],
  [town("Woodley Park"), PLAIN, PLAIN, PLAIN, town("Capitol South"), RIVER],
  [PLAIN, PLAIN, PLAIN, town("Gallery Place"), PLAIN, RIVER, PLAIN],
  [
    PLAIN,
    town("Columbia Heights"),
    PLAIN,
    PLAIN,
    city("Stadium-Armory", BLUE, white(5), 4),
    RIVER,
  ],
  [MOUNTAIN, MOUNTAIN, PLAIN, PLAIN, PLAIN, RIVER, PLAIN],
  [
    city("Fort Totten", RED, white(6), 4),
    PLAIN,
    PLAIN,
    town("Union Station"),
    RIVER,
    PLAIN,
  ],
]);
