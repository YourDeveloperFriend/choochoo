import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { duplicate } from "../../utils/functions";
import { city, grid, PLAIN, town, UNPASSABLE } from "../factory";
import { CityData } from "../../engine/state/space";
import { SpaceType } from "../../engine/state/location_type";
import z from "zod";
import { BAILEY_YARD_SAME_CITY } from "./deliver";

export const UnionPacificExpressMapData = z.object({
  transferStation: z.boolean().optional(),
});
export type UnionPacificExpressMapData = z.infer<
  typeof UnionPacificExpressMapData
>;

const BAILEY_YARD: CityData = {
  type: SpaceType.CITY,
  sameCity: BAILEY_YARD_SAME_CITY,
  color: [],
  name: "Bailey Yard",
  goods: [],
  onRoll: [],
  startingNumCubes: 2,
  mapSpecific: {
    transferStation: true,
  },
};

export const map = grid([
  [
    UNPASSABLE,
    PLAIN,
    town("Columbus"),
    PLAIN,
    PLAIN,
    PLAIN,
    ...duplicate(6, UNPASSABLE),
  ],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Scottsbluff"),
    PLAIN,
    PLAIN,
    PLAIN,
    town("Granger"),
    UNPASSABLE,
  ],
  [
    city("Omaha", PURPLE, [], 3),
    PLAIN,
    PLAIN,
    BAILEY_YARD,
    BAILEY_YARD,
    PLAIN,
    PLAIN,
    city("Cheyenne", RED, [], 3),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
  ],
  [
    PLAIN,
    town("Marysville"),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Salt Lake City", BLUE, [], 3),
  ],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Colby"),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
  ],
  [
    city("Kansas City", BLUE, [], 3),
    PLAIN,
    PLAIN,
    town("Russell"),
    PLAIN,
    PLAIN,
    PLAIN,
    city("Denver", YELLOW, [], 3),
    PLAIN,
    town("Grand Junction"),
    PLAIN,
  ],
  [
    PLAIN,
    PLAIN,
    town("Wichita"),
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    UNPASSABLE,
  ],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Oklahoma City", RED, [], 3),
    PLAIN,
    town("Dalhart"),
    PLAIN,
    PLAIN,
    UNPASSABLE,
    UNPASSABLE,
  ],
]);
