import { Entry, Primitive } from "./types";
import { assert } from "./validate";

export function peek<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

export function duplicate<T>(numCopies: number, value: T): T[] {
  return iterate(numCopies, (_) => value);
}

export function reverse<T>(arr: T[]): T[] {
  return [...arr].reverse();
}

export function insertAfter<T>(arr: T[], entry: T, newEntry: T): T[] {
  const index = arr.indexOf(entry);
  assert(index >= 0, `cannot find ${entry} in ${arr}`);
  return arr
    .slice(0, index + 1)
    .concat(newEntry)
    .concat(arr.slice(index + 1));
}

export function insertBefore<T>(arr: T[], entry: T, newEntry: T): T[] {
  const index = arr.indexOf(entry);
  assert(index >= 0, `cannot find ${entry} in ${arr}`);
  return arr.slice(0, index).concat(newEntry).concat(arr.slice(index));
}

export function lpad(
  input: number | string,
  minLength: number,
  padWith: string,
): string {
  let str = `${input}`;
  while (str.length < minLength) {
    str = padWith + str;
  }
  return str;
}

export function timeFormat(date: Date): string {
  return [
    date.getHours(),
    date.getMinutes(),
    Math.round(date.getMilliseconds() / 100),
  ]
    .map((value) => lpad(value, 2, "0"))
    .join(":");
}

export function iterate<T>(iterations: number, factory: (i: number) => T): T[] {
  const results: T[] = [];
  for (let i = 0; i < iterations; i++) {
    results.push(factory(i));
  }
  return results;
}

export function remove<T>(array: T[], value: T): T[] {
  const index = array.indexOf(value);
  assert(index !== -1, "cannot find value in array");
  return array.slice(0, index).concat(array.slice(index + 1));
}

export function replaceAll<T>(array: T[], newArray: T[]): void {
  array.splice(0, array.length);
  array.push(...newArray);
}

export function iterateHexGrid<T>(
  grid: Map<number, Map<number, T>>,
  fn: (value: T) => void,
) {
  for (const row of grid.values()) {
    for (const cell of row.values()) {
      fn(cell);
    }
  }
}

export function isPrimitive(value: unknown): value is Primitive {
  const primitives = new Set(["boolean", "number", "string"]);
  return primitives.has(typeof value);
}

export function pick<T extends object, R extends keyof T>(
  value: T,
  keys: R[],
): Pick<T, R> {
  const partial: Partial<T> = {};
  for (const key of keys) {
    partial[key] = value[key];
  }
  return partial as Pick<T, R>;
}

export function partition<R, T>(arr: R[], fn: (r: R) => T): Map<T, R[]> {
  const map = new Map<T, R[]>();
  for (const r of arr) {
    const t = fn(r);
    if (!map.has(t)) {
      map.set(t, []);
    }
    map.get(t)!.push(r);
  }
  return map;
}

export function infiniteLoopCheck(
  numChecks: number,
  data?: string,
): (moreData?: string) => void {
  let numRuns = 0;
  const lastData: Array<string | undefined> = [];
  return (moreData?: string) => {
    lastData.push(moreData);
    if (lastData.length > 5) {
      lastData.shift();
    }
    assert(
      numRuns++ < numChecks,
      `found infinite loop w/ data: ${data} moreData=${lastData}`,
    );
  };
}

export function isNotNull<T>(t: T): t is NonNullable<T> {
  return t != null;
}

export function entries<T extends object>(obj: T): Array<Entry<T>> {
  return Object.entries(obj) as Array<Entry<T>>;
}

export function arrayEqualsIgnoreOrder<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const toFind = [...arr2];
  for (const value of arr1) {
    const index = toFind.indexOf(value);
    if (index === -1) return false;
    toFind.splice(index, 1);
  }
  return true;
}
