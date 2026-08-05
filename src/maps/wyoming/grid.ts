import { SpaceData } from "../../engine/state/space";
import {
  black,
  city,
  DARK_MOUNTAIN,
  grid,
  MOUNTAIN,
  PLAIN,
  town,
} from "../factory";
import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";

export const LARAMIE = "Laramie";

export const map = grid<SpaceData>([
  [
    MOUNTAIN,
    MOUNTAIN,
    city("Green River", BLUE, black(2), 2),
    MOUNTAIN,
    MOUNTAIN,
    DARK_MOUNTAIN,
    town(LARAMIE),
    city("Cheyenne", RED, black(6), 2),
  ],
  [
    town("Kemmerer"),
    MOUNTAIN,
    MOUNTAIN,
    town("Rawlins"),
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
  ],
  [
    MOUNTAIN,
    MOUNTAIN,
    town("Lander"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Douglas"),
    PLAIN,
  ],
  [
    MOUNTAIN,
    DARK_MOUNTAIN,
    PLAIN,
    MOUNTAIN,
    city("Casper", YELLOW, black(4), 2),
    PLAIN,
    PLAIN,
  ],
  [
    city("Jackson", RED, black(1), 2),
    DARK_MOUNTAIN,
    MOUNTAIN,
    city("Thermopolis", PURPLE, black(3), 2),
    MOUNTAIN,
    PLAIN,
    PLAIN,
    town("Newcastle"),
  ],
  [MOUNTAIN, DARK_MOUNTAIN, PLAIN, DARK_MOUNTAIN, PLAIN, PLAIN, PLAIN],
  [
    MOUNTAIN,
    DARK_MOUNTAIN,
    town("Cody"),
    MOUNTAIN,
    town("Sheridan"),
    PLAIN,
    city("Gillette", YELLOW, black(5), 2),
    PLAIN,
  ],
]);
