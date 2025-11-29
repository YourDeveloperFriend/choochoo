import { Good } from "../../engine/state/good";
import { city, grid, MOUNTAIN, PLAIN, town, WATER } from "../factory";

export const map = grid([
  [WATER, WATER, PLAIN, town("Mayagüez"), PLAIN, town("Cabo Rojo")],
  [WATER, town("Aguadilla"), PLAIN, PLAIN, MOUNTAIN],
  [WATER, PLAIN, PLAIN, MOUNTAIN, MOUNTAIN, PLAIN],
  [WATER, MOUNTAIN, MOUNTAIN, MOUNTAIN, PLAIN],
  [WATER, town("Arecibo"), MOUNTAIN, town("Utuado"), MOUNTAIN, PLAIN],
  [WATER, MOUNTAIN, MOUNTAIN, MOUNTAIN, town("Ponce")],
  [WATER, WATER, PLAIN, PLAIN, MOUNTAIN, MOUNTAIN],
  [WATER, PLAIN, town("Bayamon"), MOUNTAIN, town("Cayey"), PLAIN],
  [
    WATER,
    WATER,
    city("San Juan", [Good.RED, Good.BLACK]),
    town("Caguas"),
    MOUNTAIN,
    PLAIN,
  ],
  [WATER, PLAIN, PLAIN, MOUNTAIN, PLAIN],
  [WATER, PLAIN, PLAIN, town("Humacao")],
  [WATER, town("Luquillo"), PLAIN],
]);
