import {
  BLACK,
  BLUE,
  Good,
  PURPLE,
  RED,
  YELLOW,
} from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { LandData, SpaceData } from "../../engine/state/space";
import { duplicate } from "../../utils/functions";
import {
  FIRE,
  HILL,
  city as nativeCity,
  PLAIN,
  startsLowerGrid,
  UNPASSABLE,
  WATER,
} from "../factory";
import { Dimension, SoulTrainMapData } from "./map_data";

const hellData: SoulTrainMapData = { dimension: Dimension.HELL };
const heavenData: SoulTrainMapData = { dimension: Dimension.HEAVEN };

function city(name: string, color: Good, dimension: Dimension) {
  const mapSpecific: SoulTrainMapData = { dimension };
  return {
    ...nativeCity(name, color),
    mapSpecific,
    startingNumCubes: dimension === Dimension.EARTH ? 0 : 3,
  };
}

function town(townName: string): LandData {
  return {
    type: SpaceType.FIRE,
    townName,
    mapSpecific: hellData,
  };
}

export const map = startsLowerGrid([
  [
    PLAIN,
    PLAIN,
    PLAIN,
    city("Terra", RED, Dimension.EARTH),
    PLAIN,
    HILL,
    HILL,
    PLAIN,
    town("Car Wash"),
    FIRE,
    city("Quincy", PURPLE, Dimension.HELL),
    FIRE,
    FIRE,
    FIRE,
    city("True", YELLOW, Dimension.HELL),
  ],
  [
    PLAIN,
    PLAIN,
    HILL,
    ...duplicate(5, PLAIN),
    ...duplicate(5, FIRE),
    town("Waterloo"),
    FIRE,
    FIRE,
  ],
  [
    city("Clarkton", PURPLE, Dimension.EARTH),
    HILL,
    ...duplicate(6, PLAIN),
    ...duplicate(2, FIRE),
    town("Boogie Oogie Oogie"),
    ...duplicate(4, FIRE),
  ],
  [
    PLAIN,
    HILL,
    HILL,
    PLAIN,
    PLAIN,
    city("Gaia", BLUE, Dimension.EARTH),
    PLAIN,
    PLAIN,
    FIRE,
    city("Manilow", RED, Dimension.HELL),
    ...duplicate(6, FIRE),
  ],
  [
    PLAIN,
    HILL,
    HILL,
    ...duplicate(5, PLAIN),
    ...duplicate(4, FIRE),
    town("Funky Town"),
    FIRE,
    FIRE,
  ],
  [
    PLAIN,
    city("Hankory", YELLOW, Dimension.EARTH),
    HILL,
    WATER,
    WATER,
    PLAIN,
    HILL,
    PLAIN,
    ...duplicate(7, FIRE),
    city("Hayes", BLUE, Dimension.HELL),
  ],
  [
    PLAIN,
    HILL,
    WATER,
    WATER,
    PLAIN,
    HILL,
    city("Earth", BLACK, Dimension.EARTH),
    PLAIN,
    FIRE,
    city("Summer", YELLOW, Dimension.HELL),
    ...duplicate(4, UNPASSABLE),
    FIRE,
  ],
  [
    PLAIN,
    HILL,
    HILL,
    WATER,
    WATER,
    PLAIN,
    HILL,
    PLAIN,
    FIRE,
    FIRE,
    ...duplicate(4, UNPASSABLE),
    FIRE,
    FIRE,
  ],
  [
    city("Devinia", BLUE, Dimension.EARTH),
    HILL,
    HILL,
    WATER,
    ...duplicate(4, PLAIN),
    town("September"),
    FIRE,
    ...duplicate(3, UNPASSABLE),
    city("Gaynor", RED, Dimension.HELL),
    FIRE,
  ],
  [
    PLAIN,
    ...duplicate(4, HILL),
    city("Domus", RED, Dimension.EARTH),
    PLAIN,
    PLAIN,
    FIRE,
    FIRE,
    FIRE,
    town("Le Freak"),
    ...duplicate(4, FIRE),
  ],
  [
    PLAIN,
    HILL,
    city("Masse", YELLOW, Dimension.EARTH),
    HILL,
    HILL,
    PLAIN,
    PLAIN,
    PLAIN,
    FIRE,
    town("YMCA"),
    ...duplicate(5, FIRE),
  ],
  [
    PLAIN,
    city("Julienopolis", BLACK, Dimension.EARTH),
    HILL,
    PLAIN,
    HILL,
    PLAIN,
    PLAIN,
    PLAIN,
    ...duplicate(5, FIRE),
    town("Night Fever"),
    FIRE,
    city("Ross", PURPLE, Dimension.HELL),
  ],
  [
    PLAIN,
    PLAIN,
    PLAIN,
    HILL,
    HILL,
    city("3rd Rock", PURPLE, Dimension.EARTH),
    PLAIN,
    PLAIN,
    FIRE,
    city("Kool", BLUE, Dimension.HELL),
    ...duplicate(5, FIRE),
  ],
]);

const SKY: LandData = {
  type: SpaceType.SKY,
};

export const heaven: (SpaceData | undefined)[][] = [
  [
    { ...SKY, townName: "Cloud 9", mapSpecific: heavenData },
    SKY,
    UNPASSABLE,
    UNPASSABLE,
    { ...SKY, townName: "Arcadia", mapSpecific: heavenData },
  ],
  [...duplicate(6, SKY)],
  [...duplicate(8, SKY)],
  [
    { ...SKY, townName: "Harmony", mapSpecific: heavenData },
    SKY,
    UNPASSABLE,
    UNPASSABLE,
    SKY,
    SKY,
  ],
  [SKY, SKY, UNPASSABLE, UNPASSABLE, SKY, SKY, SKY],
  [
    SKY,
    SKY,
    UNPASSABLE,
    UNPASSABLE,
    { ...SKY, townName: "Nirvana", mapSpecific: heavenData },
    SKY,
  ],
  [
    { ...SKY, townName: "Shangrila", mapSpecific: heavenData },
    SKY,
    UNPASSABLE,
    UNPASSABLE,
    SKY,
    SKY,
    SKY,
  ],
  [...duplicate(6, SKY)],
  [
    SKY,
    SKY,
    { ...SKY, townName: "Pearly Gates", mapSpecific: heavenData },
    ...duplicate(4, SKY),
  ],
  [
    { ...SKY, townName: "Utopia", mapSpecific: heavenData },
    ...duplicate(5, SKY),
  ],
  [SKY, SKY, UNPASSABLE, UNPASSABLE, SKY, SKY, SKY],
  [
    SKY,
    UNPASSABLE,
    UNPASSABLE,
    UNPASSABLE,
    { ...SKY, townName: "Zion", mapSpecific: heavenData },
    UNPASSABLE,
  ],
  [
    { ...SKY, townName: "Elysium", mapSpecific: heavenData },
    SKY,
    ...duplicate(5, UNPASSABLE),
  ],
];
