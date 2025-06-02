import z from "zod";

export enum SpaceStyle {
  // Don't change these numbers! They are stored in the DB like this.
  LIGHT_PLAIN = 1,
  LIGHT_RIVER = 2,
}

export const SpaceStyleZod = z.nativeEnum(SpaceStyle);
