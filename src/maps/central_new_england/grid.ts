import { SpaceData } from "../../engine/state/space";
import {
  city,
  grid,
  HILL,
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
    HILL,
    RIVER,
    city("Burlington", RED, [], 4),
    HILL,
    HILL,
    city("Bristol", YELLOW, [], 4),
    RIVER,
    town("Brandon"),
    HILL,
    HILL,
    RIVER,
    RIVER,
    HILL,
    HILL,
    city("Bennington", PURPLE, [], 4),
  ]),
  vermont([
    RIVER,
    HILL,
    RIVER,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    RIVER,
    city("Rutland", BLUE, [], 4),
    HILL,
    HILL,
    town("Manchester Center"),
    HILL,
    HILL,
  ]),
  vermont([
    UNPASSABLE,
    RIVER,
    HILL,
    town("Cambridge"),
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    RIVER,
    RIVER,
    HILL,
    HILL,
    HILL,
    town("Readsboro"),
  ]),
  vermont([
    RIVER,
    HILL,
    RIVER,
    HILL,
    HILL,
    HILL,
    town("Northfield"),
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
  ]),
  vermont([
    UNPASSABLE,
    HILL,
    HILL,
    town("Morrisville"),
    HILL,
    city("Montpelior", BLUE, [], 4),
    HILL,
    HILL,
    HILL,
    HILL,
    town("Woodstock"),
    HILL,
    town("Springfield"),
    HILL,
    HILL,
    HILL,
    city("Brattleboro", RED, [], 4),
  ]),
  vermont([
    HILL,
    HILL,
    HILL,
    RIVER,
    HILL,
    HILL,
    HILL,
    town("Randolf"),
    HILL,
    border(HILL, Direction.BOTTOM_RIGHT),
    border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(
      city("Bellows Falls", YELLOW, [], 4),
      Direction.TOP_RIGHT,
      Direction.BOTTOM_RIGHT,
    ),
    border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
    border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
  ]),
  concat(
    vermont([
      UNPASSABLE,
      HILL,
      HILL,
      town("Cabol"),
      HILL,
      HILL,
      HILL,
      HILL,
      border(HILL, Direction.BOTTOM_RIGHT),
      border(
        HILL,
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
      HILL,
      city("Keene", PURPLE, [], 4),
      HILL,
    ]),
  ),
  concat(
    vermont([
      city("Newport", RED, [], 4),
      HILL,
      HILL,
      RIVER,
      town("St. Johnsbury"),
      border(HILL, Direction.BOTTOM_RIGHT),
      border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(
        city("Branford", PURPLE, [], 4),
        Direction.TOP_RIGHT,
        Direction.BOTTOM_RIGHT,
        Direction.BOTTOM,
      ),
    ]),
    newHampshire([HILL, HILL, HILL, PLAIN, PLAIN, HILL, HILL, HILL]),
  ),
  concat(
    vermont([
      UNPASSABLE,
      HILL,
      HILL,
      HILL,
      HILL,
      border(HILL, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      city("Woodsville", YELLOW, [], 4),
      HILL,
      HILL,
      HILL,
      HILL,
      PLAIN,
      town("Newport"),
      PLAIN,
      HILL,
      HILL,
      town("Jaffrey"),
    ]),
  ),
  concat(
    vermont([
      HILL,
      HILL,
      HILL,
      city("Lyndonville", YELLOW, [], 4),
      border(HILL, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      HILL,
      HILL,
      town("Grafton"),
      HILL,
      HILL,
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
      HILL,
      HILL,
      border(HILL, Direction.BOTTOM_RIGHT, Direction.BOTTOM),
    ]),
    newHampshire([
      city("Littleton", BLUE, [], 4),
      HILL,
      HILL,
      HILL,
      HILL,
      HILL,
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
      border(HILL, Direction.BOTTOM_RIGHT),
      border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(HILL, Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT),
      border(
        HILL,
        Direction.TOP_RIGHT,
        Direction.BOTTOM_RIGHT,
        Direction.BOTTOM,
      ),
    ]),
    newHampshire([
      PLAIN,
      HILL,
      HILL,
      town("Lincoln"),
      HILL,
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
    HILL,
    HILL,
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
    HILL,
    town("Errol"),
    HILL,
    city("Berlin", RED, [], 4),
    HILL,
    town("Glen"),
    PLAIN,
    PLAIN,
    town("Center Ossipee"),
    PLAIN,
    town("Alton"),
    HILL,
    town("Northwood"),
    PLAIN,
    PLAIN,
    town("Salem"),
  ]),
  newHampshire([
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    PLAIN,
    PLAIN,
    city("Conway", PURPLE, [], 4),
    PLAIN,
    PLAIN,
    PLAIN,
    HILL,
    HILL,
    HILL,
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
    HILL,
    city("Portsmouth", PURPLE, [], 4),
  ]),
]);
