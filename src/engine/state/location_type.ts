import z from "zod";

export enum SpaceType {
  // Don't change these numbers! They are stored in the DB like this.
  CITY = 1,
  PLAIN = 2,
  RIVER = 3,
  MOUNTAIN = 4,
  STREET = 5,
  SWAMP = 6,
  LAKE = 7,
  UNPASSABLE = 8,
  HILL = 9,
  DESERT = 10,
  WATER = 11,
  FIRE = 12,
  SKY = 13,
}

export const SpaceTypeZod = z.nativeEnum(SpaceType);
