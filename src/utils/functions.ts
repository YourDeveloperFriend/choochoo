import { Entry, Primitive } from "./types";
import { assert } from "./validate";

export function isNotEmpty(str: string|undefined|null): str is string {
  return str != null && str != '';
}

export function capitalizeFirstLetter(str: string) {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

function lpad(
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

export function removeKeys<T, R extends keyof T>(
  obj: T,
  ...keys: R[]
): Omit<T, R> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, R>;
}

export function isPrimitive(value: unknown): value is Primitive {
  const primitives = new Set(["boolean", "number", "string"]);
  return primitives.has(typeof value);
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

export function formatMillisecondDuration(millis: number): string {
  // eslint-disable-next-line
  const format = new (Intl as any).DurationFormat("en", { style: "short" });
  const totalMinutes = Math.round(millis / 60000);
  const duration = {
    minutes: totalMinutes % 60,
    hours: Math.floor(totalMinutes / 60) % 24,
    days: Math.floor(totalMinutes / 60 / 24),
  };
  return format.format(duration);
}

export function log(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(...args);
}

export function logError(
  tag: string,
  error: unknown,
  ...args: unknown[]
): void {
  // eslint-disable-next-line no-console
  console.error(tag);
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line no-console
  console.error(...args);
}
