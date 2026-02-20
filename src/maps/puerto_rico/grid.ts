import { Good } from "../../engine/state/good";
import { city, grid, MOUNTAIN, PLAIN, town, UNPASSABLE } from "../factory";

export const map = grid([
  [UNPASSABLE, PLAIN, town("Mayagüez"), PLAIN, town("Cabo Rojo")],
  [town("Aguadilla"), PLAIN, PLAIN, MOUNTAIN],
  [PLAIN, PLAIN, MOUNTAIN, MOUNTAIN, PLAIN],
  [MOUNTAIN, MOUNTAIN, MOUNTAIN, PLAIN],
  [town("Arecibo"), MOUNTAIN, town("Utuado"), MOUNTAIN, PLAIN],
  [MOUNTAIN, MOUNTAIN, MOUNTAIN, town("Ponce")],
  [PLAIN, PLAIN, MOUNTAIN, MOUNTAIN],
  [PLAIN, PLAIN, MOUNTAIN, MOUNTAIN],
  [PLAIN, town("Bayamon"), MOUNTAIN, town("Cayey"), PLAIN],
  [city("San Juan", [Good.RED, Good.BLACK]), town("Caguas"), MOUNTAIN, PLAIN],
  [PLAIN, PLAIN, MOUNTAIN, PLAIN],
  [PLAIN, PLAIN, town("Humacao")],
  [town("Luquillo"), PLAIN],
]);
