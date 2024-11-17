import { BLACK, CityGroup, WHITE } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { duplicate } from "../../utils/functions";
import { city, customCity, grid, MOUNTAIN, plain, PLAIN, RIVER, town, UNPASSABLE } from "../factory";

export const map = grid([
  [
    city('To Vienna', Good.YELLOW, BLACK, 4),
    plain({ terrainCost: 10 }),
    MOUNTAIN,
    PLAIN,
    town('Prag'),
    plain({ terrainCost: 9 }),
    city('To Breslau', Good.PURPLE, BLACK, 6),
    plain({ terrainCost: 8 }),
    UNPASSABLE,
    outlet('To Warsaw'),
    UNPASSABLE,
    plain({ terrainCost: 12 }),
    city('To Königsberg', Good.YELLOW, BLACK, 6),
  ],
  [
    plain({ terrainCost: 10 }),
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    MOUNTAIN,
    plain({ terrainCost: 9 }),
    plain({ terrainCost: 9 }),
    town('Görlitz'),
    plain({ terrainCost: 8 }),
    plain({ terrainCost: 8 }),
    town('Stettin'),
    plain({ terrainCost: 12 }),
  ], [
    MOUNTAIN,
    MOUNTAIN,
    town('Passau'),
    MOUNTAIN,
    town('Pilsen'),
    MOUNTAIN,
    city('Dresden', Good.BLUE, BLACK, 5),
    ...duplicate(4, PLAIN),
    RIVER,
  ], [
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    MOUNTAIN,
    MOUNTAIN,
    ...duplicate(4, PLAIN),
    customCity({ name: 'Berlin', color: Good.BLACK, onRoll: [], startingNumCubes: 0, group: CityGroup.BLACK }),
    PLAIN,
    PLAIN,
  ], [
    MOUNTAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    PLAIN,
    town('Leipzig'),
    ...duplicate(3, PLAIN),
    town('Rostock'),
  ], [
    MOUNTAIN,
    city('Munich', Good.RED, BLACK, 1),
    PLAIN,
    city('Nürnberg', Good.RED, BLACK, 2),
    PLAIN,
    MOUNTAIN,
    PLAIN,
    PLAIN,
    town('Magdeberg'),
    PLAIN,
    PLAIN,
    UNPASSABLE,
    outlet('Copenhagen'),
  ], [
    MOUNTAIN,
    MOUNTAIN,
    ...duplicate(3, PLAIN),
    town('Würzburg'),
    ...duplicate(6, PLAIN),
    UNPASSABLE,
    plain({ terrainCost: 8 }),
  ], [
    plain({ terrainCost: 9 }),
    MOUNTAIN,
    ...duplicate(3, PLAIN),
    MOUNTAIN,
    PLAIN,
    town('Kassel'),
    RIVER,
    city('Hannover', Good.RED, WHITE, 5),
    RIVER,
    town('Hamberg'),
    PLAIN,
    PLAIN,
  ],
  [
    city('To Zürich', Good.PURPLE, WHITE, 1),
    plain({ terrainCost: 9 }),
    MOUNTAIN,
    city('Stuttgart', Good.BLUE, WHITE, 2),
    PLAIN,
    town('Frankfurt'),
    ...duplicate(5, PLAIN),
    RIVER,
  ], [
    plain({ terrainCost: 9 }),
    town('Freiburg'),
    PLAIN,
    PLAIN,
    RIVER,
    RIVER,
    PLAIN,
    city('Essen & Dortmund', Good.BLUE, BLACK, 3),
    PLAIN,
    PLAIN,
    city('Bremen & Oldenberg', Good.BLUE, WHITE, 4),
  ], [
    ...duplicate(3, MOUNTAIN),
    town('Saarbrüken'),
    PLAIN,
    PLAIN,
    RIVER,
    city('Düsseldorf & Koöln', Good.RED, WHITE, 3),
    RIVER,
    PLAIN,
    PLAIN,
  ], [
    plain({ terrainCost: 10 }),
    PLAIN,
    plain({ terrainCost: 11 }),
    plain({ terrainCost: 11 }),
    PLAIN,
    plain({ terrainCost: 7 }),
    plain({ terrainCost: 7 }),
    RIVER,
    plain({ terrainCost: 6 }),
    plain({ terrainCost: 6 }),
    PLAIN,
  ], [
    outlet('To Lyon'),
    UNPASSABLE,
    UNPASSABLE,
    outlet('To Paris'),
    UNPASSABLE,
    UNPASSABLE,
    outlet('To Antwerp'),
    UNPASSABLE,
    UNPASSABLE,
    outlet('To Rotterdam'),
  ],
]);

// TODO: figure out how to represent this.
function outlet(name: string): typeof UNPASSABLE {
  return UNPASSABLE;
}