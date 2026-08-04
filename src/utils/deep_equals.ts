import { Map as ImmutableMap, Set as ImmutableSet } from "immutable";
import { Coordinates } from "./coordinates";
import { isPrimitive } from "./functions";
import { assert } from "./validate";

export function deepEquals<T>(
  t1: T,
  t2: NoInfer<T>,
  path: string[] = [],
): unknown {
  if (isPrimitive(t1)) {
    return t1 === t2;
  } else if (t1 == null) {
    return t2 == null;
  } else if (t2 == null) {
    return t1 == null;
  } else if (Array.isArray(t1)) {
    return (
      Array.isArray(t2) &&
      t1.length === t2.length &&
      t1.every((v, i) => deepEquals(t2[i], v, path.concat(`${i}`)))
    );
  } else if (ImmutableSet.isSet(t1) || t1 instanceof Set) {
    // `||`, not `&&`: no value is both an ImmutableSet and a native Set, so
    // requiring both made every set comparison false.
    if (!(ImmutableSet.isSet(t2) || t2 instanceof Set)) return false;
    const t2List = [...t2];
    return (
      t1.size === t2.size &&
      [...t1].every((k1, index) =>
        t2List.some((k2) => deepEquals(k1, k2, path.concat(`${index}`))),
      )
    );
  } else if (ImmutableMap.isMap(t1) || t1 instanceof Map) {
    if (!(ImmutableMap.isMap(t2) || t2 instanceof Map)) return false;
    if (t1.size !== t2.size) return false;
    const t2KeyList = [...t2.keys()];
    return [...t1].every(([k1, v1]) => {
      const k2 = t2KeyList.find((k2) =>
        deepEquals(k1, k2, path.concat(`Key<${k1}>`)),
      );
      if (k2 === undefined) {
        return false;
      }
      return deepEquals(v1, t2.get(k2), path.concat(`${k2}`));
    });
  } else if (t1 instanceof Coordinates) {
    return t1 === t2;
  } else {
    // Guarded so that neither the path string nor the interpolation of the values
    // is built on the passing path -- this branch runs for every object compared.
    if (typeof t1 !== "object" || typeof t2 !== "object") {
      const pathStr = path.join(" -> ");
      assert(
        typeof t1 === "object",
        `Expected object, found ${t1}: ` + pathStr,
      );
      assert(
        typeof t2 === "object",
        `Expected object, found ${t2}: ` + pathStr,
      );
    }
    // Compares keys directly rather than routing through the Map branch above.
    // That path looked up each key with a linear `find` over the other object's
    // keys, making an object comparison quadratic in its field count.
    const keys1 = Object.keys(t1 as object);
    const o2 = t2 as Record<string, unknown>;
    if (keys1.length !== Object.keys(o2).length) return false;
    for (const key of keys1) {
      if (!(key in o2)) return false;
      if (
        !deepEquals(
          (t1 as Record<string, unknown>)[key],
          o2[key],
          path.concat(key),
        )
      ) {
        return false;
      }
    }
    return true;
  }
}
