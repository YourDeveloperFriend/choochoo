import { describe, expect, it } from "vitest";
import { setInjectionContext } from "../framework/execution_context";
import { InjectionContext } from "../framework/inject";
import { StateStore } from "../framework/state";
import { GameMemory } from "../game/game_memory";
import { GRID, INTER_CITY_CONNECTIONS } from "../game/state";
import { ComplexTileType, SimpleTileType, TownTileType } from "../state/tile";
import { BuilderHelper } from "./helper";

/**
 * Pittsburgh removes ComplexTileType.X from its tile manifest, which used to
 * make BuilderHelper dereference a missing entry and throw a TypeError.
 *
 * That was reachable in ordinary play: TownTileType.X resolves through
 * getTileOptions to ComplexTileType.X, so a player building a town X tile on
 * Pittsburgh hit it, and the server answered with a 500 instead of a validation
 * error.
 */
describe("BuilderHelper tile manifest", () => {
  function helperFor(gameKey: string): BuilderHelper {
    const context = new InjectionContext(gameKey);
    setInjectionContext(context);
    try {
      context.get(GameMemory).setGame({ id: 1, gameKey, variant: {} });
      const state = context.get(StateStore);
      state.init(GRID, new Map());
      state.init(INTER_CITY_CONNECTIONS, []);
      return context.get(BuilderHelper);
    } finally {
      setInjectionContext();
    }
  }


  describe("on a map that stocks every tile", () => {
    it("reports common tiles as available", () => {
      const helper = helperFor("rust-belt");

      expect(helper.tileAvailableInManifest(SimpleTileType.STRAIGHT)).toBe(true);
      expect(helper.tileAvailableInManifest(ComplexTileType.X)).toBe(true);
      expect(helper.tileAvailableInManifest(TownTileType.X)).toBe(true);
    });
  });

  describe("on Pittsburgh, which removes ComplexTileType.X", () => {
    it("reports the removed tile as unavailable instead of throwing", () => {
      const helper = helperFor("pittsburgh");

      expect(() =>
        helper.tileAvailableInManifest(ComplexTileType.X),
      ).not.toThrow();
      expect(helper.tileAvailableInManifest(ComplexTileType.X)).toBe(false);
    });

    it("handles a town tile that resolves to the removed tile", () => {
      const helper = helperFor("pittsburgh");

      // TownTileType.X's options are [ComplexTileType.X, COEXISTING_CURVES].
      // The removed one must be skipped rather than dereferenced.
      expect(() => helper.tileAvailableInManifest(TownTileType.X)).not.toThrow();
      expect(helper.tileAvailableInManifest(TownTileType.X)).toBe(true);
    });

    it("still stocks the tiles it did not remove", () => {
      const helper = helperFor("pittsburgh");

      expect(helper.tileAvailableInManifest(SimpleTileType.STRAIGHT)).toBe(true);
      expect(helper.tileAvailableInManifest(SimpleTileType.CURVE)).toBe(true);
      expect(
        helper.tileAvailableInManifest(ComplexTileType.COEXISTING_CURVES),
      ).toBe(true);
    });

    it("can build its whole manifest without throwing", () => {
      const helper = helperFor("pittsburgh");
      const everyTileType = [
        ...Object.values(SimpleTileType),
        ...Object.values(TownTileType),
        ...Object.values(ComplexTileType),
      ].filter((value): value is number => typeof value === "number");

      for (const tileType of everyTileType) {
        expect(() => helper.tileAvailableInManifest(tileType)).not.toThrow();
      }
    });
  });

});
