import z from "zod";
import { Key, MapKey } from "../../engine/framework/key";
import { City } from "../../engine/map/city";
import { PlayerColorZod } from "../../engine/state/player";
import { SpaceType } from "../../engine/state/location_type";
import { map } from "./grid";

export const MANIFEST = new MapKey(
  "fac51Manifest",
  PlayerColorZod.parse,
  z.number().int().nonnegative().parse,
);
export const MANIFEST_PENALTIES = [0, 1, 3, 6, 10, 15, 21] as const;
export const NEW_CITY_SUPPLY = new Key("fac51NewCitySupply", {
  parse: z.number().int().nonnegative().parse,
});

export function isDelivery(city: City): boolean {
  return city.data.mapSpecific?.delivery === true;
}

// Clockwise in the SVG, starting at the upper-right delivery space.
export const DELIVERY_SPACES = [5, 3, 2, 1, 4, 6].map(
  (number) =>
    [...map].find(
      ([, space]) =>
        space.type === SpaceType.CITY && space.name === `Deliveries ${number}`,
    )![0],
);
