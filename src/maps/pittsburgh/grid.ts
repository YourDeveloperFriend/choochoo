import { BLUE, Good, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { OnRoll } from "../../engine/state/roll";
import { SpaceData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import { black, city, PLAIN, startsLowerGrid, town, white } from "../factory";

function pittCity(name: string, color: Good, num: OnRoll): SpaceData {
  return city(name, color, [white(num), black(num)], 3);
}

export const map = startsLowerGrid([
  [...duplicate(6, PLAIN)],
  [
    town("Town 1"),
    PLAIN,
    pittCity("Heidelberg", RED, 1),
    PLAIN,
    town("Town 2"),
    PLAIN,
    town("Town 3"),
  ],
  [...duplicate(6, PLAIN)],
  [
    PLAIN,
    pittCity("McKee's Rocks", BLUE, 2),
    PLAIN,
    town("Town 4"),
    PLAIN,
    town("Town 5"),
    PLAIN,
  ],
  [...duplicate(6, PLAIN)],
  [
    town("Town 6"),
    PLAIN,
    pittCity("Pittsburgh", YELLOW, 3),
    PLAIN,
    town("Town 7"),
    PLAIN,
    town("Town 8"),
  ],
  [...duplicate(6, PLAIN)],
  [
    PLAIN,
    town("Town 9"),
    PLAIN,
    pittCity("Squirrel Hill", PURPLE, 4),
    PLAIN,
    pittCity("Mount Oliver", RED, 5),
    PLAIN,
  ],
  [...duplicate(6, PLAIN)],
  [
    town("Town 10"),
    PLAIN,
    town("Town 11"),
    PLAIN,
    pittCity("Braddock's Hills", BLUE, 6),
    PLAIN,
    town("Town 12"),
  ],
  [...duplicate(6, PLAIN)],
]);
