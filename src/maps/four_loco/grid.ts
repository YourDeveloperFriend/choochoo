import { Good } from "../../engine/state/good";
import {
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  town,
  black,
  white,
  UNPASSABLE,
} from "../factory";

export const map = grid([
  // Row 0
  [
    PLAIN,
    city("Red Bull", Good.YELLOW, black(1), 3),
    PLAIN,
    PLAIN,
    town("Full Throttle"),
    PLAIN,
    PLAIN,
    PLAIN,
    city("Monster", Good.RED, black(4), 3),
    PLAIN,
  ],
  // Row 1
  [PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, town("Amp"), PLAIN, PLAIN, UNPASSABLE],
  // Row 2
  [
    PLAIN,
    city("Bang", Good.BLUE, black(2), 3),
    PLAIN,
    town("Relentless"),
    PLAIN,
    city("Rockstar", Good.YELLOW, black(3), 3),
    PLAIN,
    PLAIN,
    town("Venom"),
    PLAIN,
  ],
  // Row 3
  [
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    PLAIN,
    town("Rip It"),
    PLAIN,
    PLAIN,
    UNPASSABLE,
  ],
  // Row 4
  [
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Reign", Good.RED, black(5), 3),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
  ],
  // Row 5
  [
    town("Guru"),
    PLAIN,
    town("Wired"),
    PLAIN,
    PLAIN,
    PLAIN,
    city("Prime", Good.BLUE, black(6), 3),
    PLAIN,
    town("Volt"),
    UNPASSABLE,
  ],
  // Row 6
  [PLAIN, PLAIN, PLAIN, PLAIN, town("Burn"), PLAIN, PLAIN, PLAIN, PLAIN, PLAIN],
  // Row 7
  [
    town("Spike"),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Celsius", Good.RED, white(6), 3),
    UNPASSABLE,
  ],
  // Row 8
  [
    PLAIN,
    PLAIN,
    city("G Fuel", Good.RED, white(4), 3),
    MOUNTAIN,
    city("C4", Good.BLUE, white(5), 3),
    PLAIN,
    town("Sting"),
    PLAIN,
    PLAIN,
    PLAIN,
  ],
  // Row 9
  [PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, PLAIN, UNPASSABLE],
  // Row 10
  [
    PLAIN,
    town("5-hour Energy"),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("NOS", Good.PURPLE, white(2), 3),
    PLAIN,
    PLAIN,
    town("Emerge"),
  ],
  // Row 11
  [
    PLAIN,
    PLAIN,
    city("Ghost", Good.PURPLE, white(3), 3),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Alani Nu", Good.BLUE, white(1), 3),
    PLAIN,
    UNPASSABLE,
  ],
]);
