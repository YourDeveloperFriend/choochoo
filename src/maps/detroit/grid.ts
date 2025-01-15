import { BLUE, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { Direction } from "../../engine/state/tile";
import { duplicate } from "../../utils/functions";
import { black, bridge, city, PLAIN, startsLowerGrid, town, UNPASSABLE, white } from "../factory";
import { startFrom } from "../tile_factory";

export const map = startsLowerGrid([
  [
    PLAIN,
    city('Milford', BLUE, white(3)),
    ...duplicate(6, PLAIN),
    city('Ypsilanti', BLUE, white(1)),
  ],
  [
    ...duplicate(3, PLAIN),
    town('Wixom'),
    ...duplicate(6, PLAIN),
  ],
  [
    ...duplicate(4, PLAIN),
    city('Novi', BLUE, white(2)),
    PLAIN,
    PLAIN,
    town('Canton'),
    PLAIN,
  ],
  [
    ...duplicate(10, PLAIN),
  ],
  [
    PLAIN,
    UNPASSABLE,
    ...duplicate(7, PLAIN),
  ],
  [
    PLAIN,
    PLAIN,
    town('Bloomfield'),
    ...duplicate(3, PLAIN),
    town('Livonia'),
    PLAIN,
    PLAIN,
    city('Detroit Metro Airport', YELLOW, black(1)),
  ],
  [
    ...duplicate(9, PLAIN),
  ],
  [
    city('Pontiac', BLUE, white(4)),
    ...duplicate(9, PLAIN),
  ],
  [
    PLAIN,
    PLAIN,
    town('Birmingham'),
    PLAIN,
    city('Southfield', YELLOW, black(3)),
    PLAIN,
    PLAIN,
    city('Dearborn', YELLOW, black(2)),
    PLAIN,
  ],
  [
    PLAIN,
    town('Troy'),
    ...duplicate(8, PLAIN),
  ],
  [
    ...duplicate(9, PLAIN),
  ],
  [
    city('Utica', BLUE, white(5)),
    ...duplicate(5, PLAIN),
    city('Midtown Detroit', PURPLE, black(5)),
    PLAIN,
    PLAIN,
    PLAIN,
  ],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    town('Warren'),
    PLAIN,
    PLAIN,
    city('Downtown Detroit', PURPLE, black(6)),
    bridge({
      tile: {
        ...startFrom(Direction.TOP).curveLeft(),
        claimableCost: [8],
      },
    }),
  ],
  [
    ...duplicate(7, PLAIN),
    bridge({
      tile: {
        ...startFrom(Direction.TOP_LEFT).curveRight(),
        claimableCost: [10],
      },
    }),
    city('Windsor', RED, white(6)),
    PLAIN,
  ],
  [
    PLAIN,
    town('Mt Clemens'),
    PLAIN,
    city('St Clair Shores', YELLOW, black(4)),
    PLAIN,
    UNPASSABLE,
    UNPASSABLE,
    PLAIN,
    town('Windsor Airport'),
  ],
]);
