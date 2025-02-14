import { BLUE, Good, PURPLE, RED, YELLOW } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { SpaceData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import { city, startsLowerGrid, UNPASSABLE } from "../factory";

function discoCity(name: string, color: Good) {
  return city(name, color, [], 4);
}

function discoTown(townName: string) {
  return {
    ...FIRE,
    townName,
  };
}

const FIRE: SpaceData = {
  type: SpaceType.FIRE,
};

export const map = startsLowerGrid([
  [
    UNPASSABLE,
    UNPASSABLE,
    discoCity("Sledge", RED),
    FIRE,
    FIRE,
    discoTown("Super Freak"),
    FIRE,
    discoTown("Car Wash"),
    FIRE,
    discoCity("Quincy", PURPLE),
    ...duplicate(3, FIRE),
    discoCity("True", YELLOW),
  ],
  [
    ...duplicate(5, UNPASSABLE),
    ...duplicate(7, FIRE),
    discoTown("Waterloo"),
    FIRE,
    FIRE,
  ],
  [
    ...duplicate(3, UNPASSABLE),
    FIRE,
    discoCity("Abba", BLUE),
    FIRE,
    discoTown("More More More"),
    FIRE,
    FIRE,
    discoTown("Boogie Oogie Oogie"),
    ...duplicate(4, FIRE),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    ...duplicate(6, FIRE),
    discoCity("Manilow", RED),
    ...duplicate(6, FIRE),
  ],
  [
    ...duplicate(3, UNPASSABLE),
    discoTown("Copacabana"),
    ...duplicate(7, FIRE),
    discoTown("Funky Town"),
    FIRE,
    FIRE,
  ],
  [
    UNPASSABLE,
    discoCity("KC", YELLOW),
    ...duplicate(4, FIRE),
    discoTown("Double Dutch Bus"),
    ...duplicate(7, FIRE),
    discoCity("Hayes", BLUE),
  ],
  [
    UNPASSABLE,
    UNPASSABLE,
    discoTown("Celebration"),
    ...duplicate(5, FIRE),
    discoTown("Summer"),
    ...duplicate(4, UNPASSABLE),
    FIRE,
  ],
  [
    discoTown("Love Train"),
    ...duplicate(5, FIRE),
    discoCity("Gibb", RED),
    FIRE,
    FIRE,
    ...duplicate(4, UNPASSABLE),
    FIRE,
    FIRE,
  ],
  [
    ...duplicate(3, UNPASSABLE),
    ...duplicate(4, FIRE),
    discoTown("September"),
    FIRE,
    ...duplicate(3, UNPASSABLE),
    discoCity("Gaynor", RED),
    FIRE,
  ],
  [
    ...duplicate(2, UNPASSABLE),
    ...duplicate(3, FIRE),
    discoTown("Dancing Queen"),
    ...duplicate(4, FIRE),
    discoTown("Le Freak"),
    ...duplicate(4, FIRE),
  ],
  [
    UNPASSABLE,
    discoTown("Hot Stuff"),
    ...duplicate(6, FIRE),
    discoTown("YMCA"),
    ...duplicate(5, FIRE),
  ],
  [
    ...duplicate(3, UNPASSABLE),
    discoTown("Disco Duck"),
    ...duplicate(8, FIRE),
    discoTown("Night Fever"),
    FIRE,
    discoCity("Ross", PURPLE),
  ],
  [
    UNPASSABLE,
    discoCity("Trammps", YELLOW),
    FIRE,
    FIRE,
    FIRE,
    discoCity("Gap", PURPLE),
    FIRE,
    FIRE,
    discoCity("Kool", BLUE),
    ...duplicate(5, FIRE),
  ],
]);
