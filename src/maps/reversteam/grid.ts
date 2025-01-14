import { Good } from '../../engine/state/good';
import { duplicate } from '../../utils/functions';
import { black, city, MOUNTAIN, PLAIN, RIVER, startsLowerGrid, town, UNPASSABLE, white } from '../factory';

export const map = startsLowerGrid([
  [
    PLAIN,
    UNPASSABLE,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    city('Pittsburgh', Good.RED, black(5), 3),
    ...duplicate(4, MOUNTAIN),
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
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    RIVER,
    town('Lexington'),
    MOUNTAIN,
  ],
  [
    ...duplicate(3, UNPASSABLE),
    city('Detroit', Good.RED, black(3)),
    UNPASSABLE,
    ...duplicate(3, PLAIN),
    RIVER,
    PLAIN,
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
    UNPASSABLE,
    ...duplicate(5, PLAIN),
    town('Fort Wayne'),
    PLAIN,
    PLAIN,
    RIVER,
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
    ...duplicate(5, UNPASSABLE),
    town('Michigan City'),
    PLAIN,
    PLAIN,
    PLAIN,
    city('Evansville', Good.BLUE, black(1)),
  ],
  [
    PLAIN,
    ...duplicate(5, UNPASSABLE),
    PLAIN,
    PLAIN,
    town('Terre Haute'),
    PLAIN,
    PLAIN,
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
    ...duplicate(8, PLAIN),
    town('Springfield'),
    RIVER,
    RIVER,
  ],
  [
    ...duplicate(6, PLAIN),
    town('Rock Island'),
    PLAIN,
    RIVER,
    city('St. Louis', Good.RED, white(2)),
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
    UNPASSABLE,
    PLAIN,
    PLAIN,
    RIVER,
    ...duplicate(6, PLAIN),
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
    ...duplicate(2, PLAIN),
    city('Minneapolis', Good.BLUE, white(5)),
    ...duplicate(6, PLAIN),
    city('Kansas City', Good.PURPLE, white(3)),
  ],
]);
