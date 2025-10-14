import { SpaceData } from "../../engine/state/space";
import { Good } from "../../engine/state/good";
import { duplicate } from "../../utils/functions";
import {
  black,
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  RIVER,
  town,
  WATER,
  white,
} from "../factory";

export const map = grid<SpaceData>([
  [...duplicate(10, PLAIN), city("WIP", Good.PURPLE, white(3))]
]);
