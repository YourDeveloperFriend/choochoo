import { SpaceData } from "../../engine/state/space";
import {
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  RIVER,
  town,
  UNPASSABLE,
  WATER,
} from "../factory";
import z from "zod";
import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { Direction, DirectionZod } from "../../engine/state/tile";

const CneState = z.enum(["VERMONT", "NEW_HAMPSHIRE"]);

export const CentralNewEnglandMapData = z.object({
  state: CneState,
  stateBorder: DirectionZod.array().optional(),
});

export type CentralNewEnglandMapData = z.infer<typeof CentralNewEnglandMapData>;

function setState(
  spaces: Array<SpaceData | undefined>,
  state: "VERMONT" | "NEW_HAMPSHIRE",
): Array<SpaceData | undefined> {
  const result: Array<SpaceData | undefined> = [];
  for (const space of spaces) {
    if (space === undefined) {
      result.push(space);
    } else {
      const mapSpecific = space.mapSpecific || {};
      result.push({
        ...space,
        mapSpecific: {
          ...mapSpecific,
          state: state,
        },
      });
    }
  }
  return result;
}

function vermont(
  spaces: Array<SpaceData | undefined>,
): Array<SpaceData | undefined> {
  return setState(spaces, "VERMONT");
}

function newHampshire(
  spaces: Array<SpaceData | undefined>,
): Array<SpaceData | undefined> {
  return setState(spaces, "NEW_HAMPSHIRE");
}

function concat(
  a: Array<SpaceData | undefined>,
  b: Array<SpaceData | undefined>,
): Array<SpaceData | undefined> {
  return a.concat(b);
}

function border(space: SpaceData, ...directions: Direction[]): SpaceData {
  const mapSpecific: CentralNewEnglandMapData = space.mapSpecific || {};
  const allBorders: Direction[] = [];
  if (mapSpecific.stateBorder) {
    for (const edge of mapSpecific.stateBorder) {
      allBorders.push(edge);
    }
  }
  for (const edge of directions) {
    allBorders.push(edge);
  }
  return {
    ...space,
    mapSpecific: {
      ...mapSpecific,
      stateBorder: allBorders,
    },
  };
}

export const map = grid<SpaceData>([
  vermont([
    UNPASSABLE,
    city("Swanton", BLUE, [], 4),
    MOUNTAIN,
    RIVER,
    city("Burlington", RED, [], 4),
    MOUNTAIN,
    MOUNTAIN,
    city("Bristol", YELLOW, [], 4),
    RIVER,
    town("Brandon"),
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    RIVER,
    MOUNTAIN,
    MOUNTAIN,
    city("Bennington", PURPLE, [], 4),
  ]),
  vermont([
    RIVER,
    MOUNTAIN,
    RIVER,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    city("Rutland", BLUE, [], 4),
    MOUNTAIN,
    MOUNTAIN,
    town("Manchester Center"),
    MOUNTAIN,
    MOUNTAIN,
  ]),
  vermont([
    UNPASSABLE,
    RIVER,
    MOUNTAIN,
    town("Cambridge"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    RIVER,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Readsboro"),
  ]),
  vermont([
    RIVER,
    MOUNTAIN,
    RIVER,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Northfield"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
  ]),
  vermont([
    UNPASSABLE,
    MOUNTAIN,
    MOUNTAIN,
    town("Morrisville"),
    MOUNTAIN,
    city("Montpelior", BLUE, [], 4),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Woodstock"),
    MOUNTAIN,
    town("Springfield"),
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    city("Brattleboro", RED, [], 4),
  ]),
  vermont([
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    RIVER,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    town("Randolf"),
    MOUNTAIN,
    border(MOUNTAIN, Direction.BOTTOM_RIGHT),
    border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(
      city("Bellows Falls", YELLOW, [], 4),
      Direction.TOP_RIGHT,
      Direction.BOTTOM_RIGHT,
    ),
    border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
  ]),
  concat(
    vermont([
      UNPASSABLE,
      MOUNTAIN,
      MOUNTAIN,
      town("Cabol"),
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      border(MOUNTAIN, Direction.BOTTOM_RIGHT),
      border(
        MOUNTAIN,
        Direction.TOP_RIGHT,
        Direction.BOTTOM_RIGHT,
        Direction.BOTTOM,
      ),
    ]),
    newHampshire([
      city("Hanover", RED, [], 4),
      PLAIN,
      town("Charlestown"),
      PLAIN,
      MOUNTAIN,
      city("Keene", PURPLE, [], 4),
      MOUNTAIN,
    ]),
  ),
  concat(
    vermont([
      city("Newport", RED, [], 4),
      MOUNTAIN,
      MOUNTAIN,
      RIVER,
      town("St. Johnsbury"),
      border(MOUNTAIN, Direction.BOTTOM_RIGHT),
      border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(
        city("Branford", PURPLE, [], 4),
        Direction.TOP_RIGHT,
        Direction.BOTTOM_RIGHT,
        Direction.BOTTOM,
      ),
    ]),
    newHampshire([
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      PLAIN,
      PLAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
    ]),
  ),
  concat(
    vermont([
      UNPASSABLE,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      border(MOUNTAIN, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      city("Woodsville", YELLOW, [], 4),
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      PLAIN,
      town("Newport"),
      PLAIN,
      MOUNTAIN,
      MOUNTAIN,
      town("Jaffrey"),
    ]),
  ),
  concat(
    vermont([
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      city("Lyndonville", YELLOW, [], 4),
      border(MOUNTAIN, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      MOUNTAIN,
      MOUNTAIN,
      town("Grafton"),
      MOUNTAIN,
      MOUNTAIN,
      town("Danbury"),
      PLAIN,
      PLAIN,
      PLAIN,
      town("Bennington"),
      PLAIN,
    ]),
  ),
  concat(
    vermont([
      UNPASSABLE,
      city("Island Pond", PURPLE, [], 4),
      MOUNTAIN,
      MOUNTAIN,
      border(MOUNTAIN, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      city("Littleton", BLUE, [], 4),
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      MOUNTAIN,
      PLAIN,
      PLAIN,
      town("Contoocook"),
      PLAIN,
      PLAIN,
      town("Greenville"),
    ]),
  ),
  concat(
    vermont([
      border(MOUNTAIN, Direction.BOTTOM_RIGHT),
      border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(MOUNTAIN, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(
        MOUNTAIN,
        Direction.TOP_RIGHT,
        Direction.BOTTOM_RIGHT,
        Direction.BOTTOM,
      ),
    ]),
    newHampshire([
      PLAIN,
      MOUNTAIN,
      MOUNTAIN,
      town("Lincoln"),
      MOUNTAIN,
      town("Ashland"),
      PLAIN,
      PLAIN,
      PLAIN,
      PLAIN,
      town("New Boston"),
      PLAIN,
    ]),
  ),
  newHampshire([
    UNPASSABLE,
    city("Colebrook", YELLOW, [], 4),
    PLAIN,
    town("Groveton"),
    PLAIN,
    town("Twin Mountain"),
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    city("Laconia", BLUE, [], 4),
    PLAIN,
    city("Concord", YELLOW, [], 4),
    PLAIN,
    PLAIN,
    city("Nashua", BLUE, [], 4),
  ]),
  newHampshire([
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    WATER,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Manchester"),
    PLAIN,
  ]),
  newHampshire([
    UNPASSABLE,
    MOUNTAIN,
    town("Errol"),
    MOUNTAIN,
    city("Berlin", RED, [], 4),
    MOUNTAIN,
    town("Glen"),
    PLAIN,
    PLAIN,
    town("Center Ossipee"),
    PLAIN,
    town("Alton"),
    MOUNTAIN,
    town("Northwood"),
    PLAIN,
    PLAIN,
    town("Salem"),
  ]),
  newHampshire([
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    city("Conway", PURPLE, [], 4),
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
  ]),
  newHampshire([
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    city("Somersworth", RED, [], 4),
    MOUNTAIN,
    city("Portsmouth", PURPLE, [], 4),
  ]),
]);
