import {
  BLACK,
  BLUE,
  Good,
  PURPLE,
  RED,
  YELLOW,
} from "../../engine/state/good";
import { Direction } from "../../engine/state/tile";
import { duplicate } from "../../utils/functions";
import {
  black,
  bridge,
  city,
  grid,
  MOUNTAIN,
  plain,
  PLAIN,
  RIVER,
  town,
  UNPASSABLE,
  WATER,
  white,
} from "../factory";
import { startFrom } from "../tile_factory";

export const map = grid([
  [
    city("Scotland", [RED, BLUE], black(1)),
    WATER,
    PLAIN,
    town("Coleraine"),
    UNPASSABLE,
    PLAIN,
    PLAIN,
  ],
  [
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_RIGHT).straightAcross(),
        claimableCost: [6],
      },
    }),
    PLAIN,
    PLAIN,
    PLAIN,
    city("Londonderry", BLACK, white(1)),
    PLAIN,
    city("Glenties", [], [], 3),
  ],
  [
    UNPASSABLE,
    city("Belfast", PURPLE, white(2)),
    WATER,
    PLAIN,
    MOUNTAIN,
    plain({ unpassableEdges: [Direction.BOTTOM_RIGHT] }),
    plain({ unpassableEdges: [Direction.TOP_RIGHT] }),
    PLAIN,
  ],
  [
    PLAIN,
    PLAIN,
    town("Armagh"),
    PLAIN,
    town("Enniskillen"),
    PLAIN,
    city("Sligo", [], [], 3),
  ],
  [
    UNPASSABLE,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    RIVER,
    PLAIN,
    town("Ballina"),
    PLAIN,
  ],
  [
    UNPASSABLE,
    city("Dundalk", PURPLE, white(3)),
    PLAIN,
    town("Cavan"),
    PLAIN,
    RIVER,
    town("Castlerea"),
    PLAIN,
    PLAIN,
    city("Westport", [], [], 3),
  ],
  [
    UNPASSABLE,
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_LEFT).straightAcross(),
        claimableCost: [6],
      },
    }),
    PLAIN,
    PLAIN,
    PLAIN,
    RIVER,
    PLAIN,
    PLAIN,
    plain({ unpassableEdges: [Direction.BOTTOM, Direction.BOTTOM_RIGHT] }),
    plain({ unpassableEdges: [Direction.BOTTOM_LEFT] }),
  ],
  [
    city("Wales", [RED, BLUE], black(2)),
    WATER,
    PLAIN,
    town("Mullingar"),
    PLAIN,
    city("Athlone", [], [], 3),
    PLAIN,
    town("Galway"),
    PLAIN,
    city("Clifden", [], [], 3),
  ],
  [
    UNPASSABLE,
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM).curveLeft(),
        claimableCost: [6],
      },
    }),
    city("Dublin", PURPLE, white(4)),
    PLAIN,
    PLAIN,
    PLAIN,
    RIVER,
    MOUNTAIN,
  ],
  [
    UNPASSABLE,
    PLAIN,
    MOUNTAIN,
    PLAIN,
    town("Port Laoise"),
    PLAIN,
    RIVER,
    PLAIN,
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    town("Wicklow"),
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    city("Limerick", PURPLE, white(5)),
    plain({ unpassableEdges: [Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT] }),
    city("Ballyunion", [], [], 3),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    PLAIN,
    PLAIN,
    PLAIN,
    town("Tipperary"),
    PLAIN,
    PLAIN,
    plain({ unpassableEdges: [Direction.BOTTOM_LEFT] }),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    city("Rosslare", [], [], 2),
    PLAIN,
    city("Waterford", [], [], 2),
    PLAIN,
    MOUNTAIN,
    PLAIN,
    MOUNTAIN,
    town("Tralee"),
    plain({ unpassableEdges: [Direction.TOP_RIGHT, Direction.BOTTOM_RIGHT] }),
  ],
  [
    UNPASSABLE,
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_LEFT).curveRight(),
        claimableCost: [6],
      },
    }),
    WATER,
    WATER,
    PLAIN,
    PLAIN,
    city("Cork", Good.BLACK, white(6)),
    MOUNTAIN,
    PLAIN,
    plain({ unpassableEdges: [Direction.TOP_RIGHT] }),
    city("Valentia", [], [], 3),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    city("England", YELLOW),
    ...duplicate(3, WATER),
    bridge({
      tile: {
        ...startFrom(Direction.BOTTOM_LEFT).straightAcross(),
        claimableCost: [6],
      },
    }),
    PLAIN,
    PLAIN,
    plain({ unpassableEdges: [Direction.TOP_RIGHT] }),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    city("England", YELLOW),
    bridge({
      tile: startFrom(Direction.BOTTOM_LEFT).curveLeft(),
    }),
    UNPASSABLE,
    UNPASSABLE,
    city("Bantry", [], [], 3),
  ],
]);
