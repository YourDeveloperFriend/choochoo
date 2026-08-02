import { describe, expect, it } from "vitest";
import { PlayerColor } from "../engine/state/player";
import { Direction, SimpleTileType } from "../engine/state/tile";
import { startFrom } from "./tile_factory";

const { TOP, TOP_LEFT, TOP_RIGHT, BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT } =
  Direction;

const { RED } = PlayerColor;

describe("tile factory", () => {
  describe("simple tiles", () => {
    const { STRAIGHT, CURVE, TIGHT } = SimpleTileType;

    it("creates straight tiles", () => {
      expect(startFrom(TOP).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: TOP,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: TOP_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_RIGHT).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: BOTTOM_RIGHT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: BOTTOM,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_LEFT).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: BOTTOM_LEFT,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).straightAcross(RED)).toEqual({
        tileType: STRAIGHT,
        orientation: TOP_LEFT,
        owners: [RED],
      });
    });

    it("creates tiles that curve right", () => {
      expect(startFrom(TOP).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_RIGHT).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM_RIGHT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_LEFT).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM_LEFT,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).curveRight(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP_LEFT,
        owners: [RED],
      });
    });

    it("creates tiles that curve left", () => {
      expect(startFrom(TOP).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM_RIGHT,
        owners: [RED],
      });

      expect(startFrom(TOP_RIGHT).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_RIGHT).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: BOTTOM_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_LEFT).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).curveLeft(RED)).toEqual({
        tileType: CURVE,
        orientation: TOP_RIGHT,
        owners: [RED],
      });
    });

    it("creates tiles that tight right", () => {
      expect(startFrom(TOP).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_RIGHT).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM_RIGHT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_LEFT).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM_LEFT,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).tightRight(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP_LEFT,
        owners: [RED],
      });
    });

    it("creates tiles that tight left", () => {
      expect(startFrom(TOP).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP_RIGHT,
        owners: [RED],
      });

      expect(startFrom(TOP_RIGHT).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM_RIGHT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_RIGHT).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM,
        owners: [RED],
      });

      expect(startFrom(BOTTOM).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: BOTTOM_LEFT,
        owners: [RED],
      });

      expect(startFrom(BOTTOM_LEFT).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP_LEFT,
        owners: [RED],
      });

      expect(startFrom(TOP_LEFT).tightLeft(RED)).toEqual({
        tileType: TIGHT,
        orientation: TOP,
        owners: [RED],
      });
    });
  });
});
