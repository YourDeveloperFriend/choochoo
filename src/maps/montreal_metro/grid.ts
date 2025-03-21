import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { LandData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import {
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  town,
  UNPASSABLE,
  white,
} from "../factory";

const STREET: LandData = {
  type: SpaceType.STREET,
};

const LAKE: LandData = {
  type: SpaceType.LAKE,
};

export const map = grid([
  [
    ...duplicate(3, PLAIN),
    ...duplicate(6, STREET),
    city("Angrignon", Good.RED, white(4)),
  ],
  [
    city("Côte-Vertu", Good.PURPLE, white(5)),
    PLAIN,
    STREET,
    town("Namur"),
    PLAIN,
    city("Snowdon", Good.BLUE, white(4)),
    PLAIN,
    town("Vendôme"),
    STREET,
    PLAIN,
  ],
  [
    LAKE,
    ...duplicate(3, STREET),
    PLAIN,
    PLAIN,
    MOUNTAIN,
    STREET,
    PLAIN,
    city("Lionel-Groulx", Good.RED, white(3)),
  ],
  [
    LAKE,
    PLAIN,
    town("Canora"),
    PLAIN,
    PLAIN,
    town("Université de Montréal"),
    UNPASSABLE,
    city("Atwater", [Good.RED, Good.BLUE], white(4)),
    STREET,
    PLAIN,
  ],
  [
    town("Montmorency"),
    LAKE,
    PLAIN,
    STREET,
    town("Acadie"),
    MOUNTAIN,
    UNPASSABLE,
    PLAIN,
    STREET,
    town("Bonaventure"),
    LAKE,
  ],
  [
    PLAIN,
    LAKE,
    STREET,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    UNPASSABLE,
    town("Place-de-Arts"),
    STREET,
    LAKE,
  ],
  [
    town("Cartier"),
    LAKE,
    city("Henri-Bourassa", Good.PURPLE, white(3)),
    STREET,
    PLAIN,
    city("Jean-Talon", Good.BLUE, white(4)),
    MOUNTAIN,
    PLAIN,
    STREET,
    PLAIN,
    LAKE,
  ],
  [
    PLAIN,
    LAKE,
    STREET,
    PLAIN,
    PLAIN,
    MOUNTAIN,
    town("Laurier"),
    PLAIN,
    city("Berri-Uqam", Good.YELLOW, white(6)),
    LAKE,
  ],
  [PLAIN, LAKE, town("Saint Léonard"), ...duplicate(5, PLAIN), LAKE, LAKE],
  [
    PLAIN,
    LAKE,
    PLAIN,
    STREET,
    PLAIN,
    city("Saint Michel", Good.BLUE, white(3)),
    PLAIN,
    PLAIN,
    town("Pie-Ix"),
    LAKE,
    city("Longueuil", Good.YELLOW, white(4)),
  ],
  [...duplicate(5, UNPASSABLE), ...duplicate(3, PLAIN), LAKE, PLAIN],
  [
    ...duplicate(6, UNPASSABLE),
    PLAIN,
    city("Assomption", Good.RED, white(4)),
    PLAIN,
    LAKE,
    PLAIN,
  ],
  [...duplicate(5, UNPASSABLE), ...duplicate(3, STREET), LAKE, PLAIN],
  [
    ...duplicate(6, UNPASSABLE),
    town("Honoré-Beuagrand"),
    PLAIN,
    LAKE,
    town("Boucherville"),
  ],
]);
