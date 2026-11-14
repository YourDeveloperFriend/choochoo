import { OrderedMap } from "immutable";
import { SpaceData, CityData } from "../../engine/state/space";
import { Good } from "../../engine/state/good";
import { CityGroup } from "../../engine/state/city_group";
import { SpaceType } from "../../engine/state/location_type";
import { OnRoll } from "../../engine/state/roll";
import { Coordinates } from "../../utils/coordinates";
import { black, white, city, plain } from "../factory";

const light = plain({ style: "honeybeeLight" });
const dark = { type: SpaceType.HILL, style: "honeybeeDark" } as const;

function field(color: Good, group: CityGroup, roll: OnRoll): CityData {
  return city(
    `${group === CityGroup.WHITE ? "Light" : "Dark"} ${roll}`,
    color,
    group === CityGroup.WHITE ? white(roll) : black(roll),
  );
}

// Only one hex of each two-hex City carries its goods and growth column.
function largeField(color: Good, roll: OnRoll, secondary = false): CityData {
  return {
    ...field(color, CityGroup.BLACK, roll),
    sameCity: roll,
    startingNumCubes: secondary ? 0 : 3,
    onRoll: secondary ? [] : [black(roll)],
    group: CityGroup.BLACK,
  };
}

const W = CityGroup.WHITE;
const B = CityGroup.BLACK;
const R = Good.RED;
const P = Good.PURPLE;
const U = Good.BLUE;
const K = Good.BLACK;

// Printed rows, top to bottom; each row runs left to right.
// The clockwise view rotation restores the PDF's point-up orientation.
// t = unnamed Town; light and dark terrain cost $2 and $3 respectively.
const rows: Array<Array<SpaceData | "t">> = [
  ["t", light, light, "t", light, light, field(P, W, 3)],
  [light, dark, dark, dark, dark, dark, dark, light],
  [light, dark, "t", light, field(U, W, 2), light, "t", dark, light],
  [field(R, W, 1), dark, light, dark, dark, dark, dark, light, dark, "t"],
  [light, dark, "t", dark, light, light, light, dark, "t", dark, light],
  [
    light,
    dark,
    light,
    dark,
    light,
    largeField(P, 1),
    largeField(P, 1, true),
    light,
    dark,
    light,
    dark,
    light,
  ],
  [
    "t",
    dark,
    field(K, W, 4),
    dark,
    light,
    largeField(R, 2),
    field(K, W, 5),
    largeField(U, 3),
    light,
    dark,
    field(R, W, 6),
    dark,
    "t",
  ],
  [
    light,
    dark,
    light,
    dark,
    light,
    largeField(R, 2, true),
    largeField(U, 3, true),
    light,
    dark,
    light,
    dark,
    light,
  ],
  [light, dark, "t", dark, light, light, light, dark, "t", dark, light],
  ["t", dark, light, dark, dark, dark, dark, light, dark, field(U, B, 6)],
  [light, dark, "t", light, field(P, B, 5), light, "t", dark, light],
  [light, dark, dark, dark, dark, dark, dark, light],
  [field(R, B, 4), light, light, "t", light, light, "t"],
];

export function boardCoordinates(row: number, index: number): Coordinates {
  return Coordinates.from({ q: row, r: 12 - index + Math.min(0, 6 - row) });
}

export const map = OrderedMap<Coordinates, SpaceData>().withMutations(
  (grid) => {
    rows.forEach((row, rowIndex) =>
      row.forEach((space, index) => {
        const coordinates = boardCoordinates(rowIndex, index);
        grid.set(
          coordinates,
          space === "t"
            ? plain({
                style: "honeybeeLight",
                townName: "",
              })
            : space,
        );
      }),
    );
  },
);
