import { describe, expect, it } from "vitest";
import { deepEquals } from "./deep_equals";
import { Coordinates } from "./coordinates";
import { ImmutableMap, ImmutableSet, freeze } from "./immutable";

describe("deepEquals", () => {
  describe("primitives", () => {
    it("compares by value", () => {
      expect(deepEquals(1, 1)).toBe(true);
      expect(deepEquals("a", "a")).toBe(true);
      expect(deepEquals(true, true)).toBe(true);
      expect(deepEquals(1, 2)).toBe(false);
      expect(deepEquals("a", "b")).toBe(false);
    });

    it("treats null and undefined as equal to themselves only", () => {
      expect(deepEquals(null, null)).toBe(true);
      expect(deepEquals(undefined, undefined)).toBe(true);
      expect(deepEquals(null, 1 as unknown as null)).toBe(false);
      expect(deepEquals(1 as unknown as null, null)).toBe(false);
    });
  });

  describe("arrays", () => {
    it("compares element-wise, in order", () => {
      expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEquals([1, 2, 3], [3, 2, 1])).toBe(false);
      expect(deepEquals([1, 2], [1, 2, 3])).toBe(false);
    });

    it("recurses into nested values", () => {
      expect(deepEquals([{ a: [1] }], [{ a: [1] }])).toBe(true);
      expect(deepEquals([{ a: [1] }], [{ a: [2] }])).toBe(false);
    });
  });

  describe("objects", () => {
    it("compares by field", () => {
      expect(deepEquals({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
      expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false);
    });

    it("ignores key order", () => {
      expect(deepEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it("distinguishes a missing field from an undefined one", () => {
      expect(deepEquals({ a: undefined }, {} as { a: undefined })).toBe(false);
    });

    it("recurses into nested objects", () => {
      expect(deepEquals({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(
        true,
      );
      expect(deepEquals({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(
        false,
      );
    });
  });

  describe("sets", () => {
    // Regression: the t2 check required a value to be both an ImmutableSet and a
    // native Set, which nothing is, so every set compared unequal to every other
    // set -- including to itself.
    it("compares two immutable sets", () => {
      expect(deepEquals(ImmutableSet([1, 2]), ImmutableSet([1, 2]))).toBe(true);
      expect(deepEquals(ImmutableSet([1, 2]), ImmutableSet([1, 3]))).toBe(
        false,
      );
      expect(deepEquals(ImmutableSet([1, 2]), ImmutableSet([1]))).toBe(false);
    });

    it("compares two native sets", () => {
      expect(deepEquals(new Set([1, 2]), new Set([1, 2]))).toBe(true);
      expect(deepEquals(new Set([1, 2]), new Set([1, 3]))).toBe(false);
    });

    // Casts because the signature pins both sides to one type; the mixed pairing
    // is the point, since freeze() hands back an immutable set for a native one.
    it("compares a native set to an immutable one", () => {
      expect(
        deepEquals(
          new Set([1, 2]),
          ImmutableSet([1, 2]) as unknown as Set<number>,
        ),
      ).toBe(true);
      expect(
        deepEquals(
          ImmutableSet([1, 2]),
          new Set([1, 2]) as unknown as ImmutableSet<number>,
        ),
      ).toBe(true);
    });

    it("ignores insertion order", () => {
      expect(deepEquals(new Set([1, 2, 3]), new Set([3, 1, 2]))).toBe(true);
    });

    it("compares sets of objects structurally", () => {
      expect(deepEquals(new Set([{ a: 1 }]), new Set([{ a: 1 }]))).toBe(true);
      expect(deepEquals(new Set([{ a: 1 }]), new Set([{ a: 2 }]))).toBe(false);
    });

    it("does not equate a set with a non-set", () => {
      expect(deepEquals(new Set([1]), [1] as unknown as Set<number>)).toBe(
        false,
      );
    });

    // freeze() turns native sets into immutable ones, so anything held in game
    // state arrives here as an ImmutableSet -- which is what made this reachable.
    it("compares sets that have been through freeze", () => {
      expect(deepEquals(freeze(new Set([1, 2])), freeze(new Set([1, 2])))).toBe(
        true,
      );
      expect(
        deepEquals(freeze({ a: new Set([1]) }), freeze({ a: new Set([1]) })),
      ).toBe(true);
      expect(
        deepEquals(freeze({ a: new Set([1]) }), freeze({ a: new Set([2]) })),
      ).toBe(false);
    });
  });

  describe("maps", () => {
    it("compares two immutable maps", () => {
      expect(deepEquals(ImmutableMap({ a: 1 }), ImmutableMap({ a: 1 }))).toBe(
        true,
      );
      expect(deepEquals(ImmutableMap({ a: 1 }), ImmutableMap({ a: 2 }))).toBe(
        false,
      );
    });

    it("compares two native maps", () => {
      expect(deepEquals(new Map([["a", 1]]), new Map([["a", 1]]))).toBe(true);
      expect(deepEquals(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
    });

    it("compares a native map to an immutable one", () => {
      expect(
        deepEquals(
          new Map([["a", 1]]),
          ImmutableMap({ a: 1 }) as unknown as Map<string, number>,
        ),
      ).toBe(true);
    });

    it("compares by size", () => {
      expect(
        deepEquals(
          new Map([
            ["a", 1],
            ["b", 2],
          ]),
          new Map([["a", 1]]),
        ),
      ).toBe(false);
    });
  });

  describe("coordinates", () => {
    it("compares interned coordinates by identity", () => {
      expect(
        deepEquals(
          Coordinates.from({ q: 1, r: 2 }),
          Coordinates.from({ q: 1, r: 2 }),
        ),
      ).toBe(true);
      expect(
        deepEquals(
          Coordinates.from({ q: 1, r: 2 }),
          Coordinates.from({ q: 2, r: 1 }),
        ),
      ).toBe(false);
    });
  });
});
