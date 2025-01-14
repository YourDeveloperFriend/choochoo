import { Good } from '../../engine/state/good';
import { duplicate } from '../../utils/functions';
import { black, city, grid, MOUNTAIN, PLAIN, RIVER, town, UNPASSABLE, white } from '../factory';

export const map = grid([
  [
    ...duplicate(10, PLAIN),
    city('Kansas City', Good.PURPLE, white(3)),
  ],
  [
    ...duplicate(2, PLAIN),
    city('Minneapolis', Good.BLUE, white(5)),
    ...duplicate(7, PLAIN),
  ],
  [
    city('Deluth', Good.PURPLE, white(6)),
    ...duplicate(2, PLAIN),
    RIVER,
    ...duplicate(3, PLAIN),
    city('Desmoines', Good.BLUE, white(4)),
    ...duplicate(3, PLAIN),
  ],
  [
    UNPASSABLE,
    PLAIN,
    PLAIN,
    RIVER,
    ...duplicate(6, PLAIN),
  ],
  [
    UNPASSABLE,
    ...duplicate(2, PLAIN),
    town('La Crosse'),
    ...duplicate(5, RIVER),
    PLAIN,
    PLAIN,
  ],
  [
    ...duplicate(6, PLAIN),
    town('Rock Island'),
    PLAIN,
    RIVER,
    city('St. Louis', Good.RED, white(2)),
  ],
  [
    ...duplicate(8, PLAIN),
    town('Springfield'),
    RIVER,
    RIVER,
  ],
  [
    PLAIN,
    town('Green Bay'),
    PLAIN,
    town('Milwaukee'),
    PLAIN,
    city('Chicago', Good.RED, white(1)),
    ...duplicate(4, PLAIN),
  ],
  [
    ...duplicate(7, UNPASSABLE),
    PLAIN,
    PLAIN,
    town('Terre Haute'),
    PLAIN,
  ],
  [
    ...duplicate(5, UNPASSABLE),
    town('Michigan City'),
    PLAIN,
    PLAIN,
    PLAIN,
    city('Evansville', Good.BLUE, black(1)),
  ],
  [
    UNPASSABLE,
    PLAIN,
    PLAIN,
    town('Grand Rapids'),
    ...duplicate(4, PLAIN),
    town('Indianapolis'),
    PLAIN,
    RIVER,
  ],
  [
    UNPASSABLE,
    ...duplicate(5, PLAIN),
    town('Fort Wayne'),
    PLAIN,
    PLAIN,
    RIVER,
  ],
  [
    ...duplicate(3, UNPASSABLE),
    PLAIN,
    PLAIN,
    town('Toledo'),
    PLAIN,
    PLAIN,
    city('Cincinatti', Good.BLUE, black(2)),
    RIVER,
    PLAIN,
  ],
  [
    ...duplicate(3, UNPASSABLE),
    city('Detroit', Good.RED, black(3)),
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    RIVER,
    town('Lexington'),
  ],
  [
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    RIVER,
    PLAIN,
    MOUNTAIN,
  ],
  [
    ...duplicate(3, PLAIN),
    UNPASSABLE,
    town('Cleveland'),
    PLAIN,
    PLAIN,
    RIVER,
    PLAIN,
    MOUNTAIN,
  ],
  [
    PLAIN,
    city('Toronto', Good.YELLOW, black(6)),
    RIVER,
    UNPASSABLE,
    PLAIN,
    PLAIN,
    RIVER,
    RIVER,
    city('Wheeling', Good.YELLOW, black(4), 3),
    MOUNTAIN,
    MOUNTAIN,
  ],
  [
    PLAIN,
    UNPASSABLE,
    town('Buffalo'),
    PLAIN,
    MOUNTAIN,
    city('Pittsburgh', Good.RED, black(5), 3),
    ...duplicate(4, MOUNTAIN),
  ],
]);
