import { Map as ImmutableMap } from "immutable";
import { BLACK, WHITE } from "../engine/state/city_group";
import { Good } from "../engine/state/good";
import { GridData } from "../engine/state/grid";
import { InterCityConnection } from "../engine/state/inter_city_connection";
import { SpaceType } from "../engine/state/location_type";
import { OnRoll, OnRollData } from "../engine/state/roll";
import { CityData, LandData } from "../engine/state/space";
import { Coordinates } from "../utils/coordinates";
import { duplicate } from "../utils/functions";

export const PLAIN: LandData = {
  type: SpaceType.PLAIN,
};

export const HILL: LandData = {
  type: SpaceType.HILL,
};

export const FIRE: LandData = {
  type: SpaceType.FIRE,
};

export function plain(data: Omit<LandData, "type">): LandData {
  return { ...data, type: SpaceType.PLAIN };
}

export function bridge(data: Omit<LandData, "type">): LandData {
  return { ...data, type: SpaceType.WATER };
}

export const UNPASSABLE = undefined;

export const RIVER: LandData = {
  type: SpaceType.RIVER,
};

export const WATER: LandData = {
  type: SpaceType.WATER,
};

export const MOUNTAIN: LandData = {
  type: SpaceType.MOUNTAIN,
};

export function black(onRoll: OnRoll): OnRollData {
  return { group: BLACK, onRoll, goods: [] };
}

export function white(onRoll: OnRoll): OnRollData {
  return { group: WHITE, onRoll, goods: [] };
}

export function city(
  name: string,
  cityColor?: Good | Good[],
  onRollData?: OnRollData | OnRollData[],
  startingNumCubes = 2,
): CityData {
  const onRoll = Array.isArray(onRollData)
    ? onRollData
    : onRollData != null
      ? [onRollData]
      : [];
  const color = Array.isArray(cityColor)
    ? cityColor
    : cityColor != null
      ? [cityColor]
      : [];
  return customCity({
    name,
    color: Array.isArray(color) ? color : [color],
    startingNumCubes,
    onRoll,
    goods: [],
  });
}

export function customCity(city: Omit<CityData, "type">): CityData {
  return { ...city, type: SpaceType.CITY };
}

export function startsLowerGrid<T>(
  array: Array<Array<T | undefined>>,
): ImmutableMap<Coordinates, T> {
  return grid(array, true);
}

export function grid<T>(
  array: Array<Array<T | undefined>>,
  startsLower = false,
): ImmutableMap<Coordinates, T> {
  const newArray = offset(array, startsLower);

  return ImmutableMap<Coordinates, T>().withMutations((grid) => {
    for (const [q, row] of newArray.entries()) {
      for (const [r, value] of row.entries()) {
        if (value == null) continue;
        grid.set(Coordinates.from({ q, r }), value);
      }
    }
  });
}

function offset<T>(
  grid: Array<Array<T | undefined>>,
  startsLower = false,
): Array<Array<T | undefined>> {
  const newGrid: Array<Array<T | undefined>> = [];
  for (let i = 0; i < grid.length; i++) {
    const newColumn: Array<T | undefined> = [];
    newColumn.push(
      ...duplicate(getOffset(i, grid.length, startsLower), UNPASSABLE),
    );
    newGrid.push([...newColumn, ...grid[i]]);
  }
  return newGrid;
}

function getOffset(i: number, length: number, startsLower: boolean): number {
  const placement = startsLower ? Math.ceil(i / 2) : Math.floor(i / 2);
  const total = Math.ceil(length / 2);
  return total - placement;
}

export function town(townName: string): LandData {
  return {
    ...PLAIN,
    townName,
  };
}

export function interCityConnections(
  grid: GridData,
  connections: Array<[string, string, number?]>,
): InterCityConnection[] {
  const cities = new Map(
    [...grid.entries()].map(([coordinates, space]) => {
      const name = space.type === SpaceType.CITY ? space.name : space.townName;
      return [name, coordinates];
    }),
  );
  return connections.map((connects): InterCityConnection => {
    const left = cities.get(connects[0]);
    const right = cities.get(connects[1]);
    let cost: number;
    if (connects.length >= 3 && connects[2] !== undefined) {
      cost = connects[2];
    } else {
      cost = 2;
    }

    return {
      connects: [left!, right!],
      cost: cost,
      owner: undefined,
    };
  });
}
