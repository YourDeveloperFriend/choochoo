import { EngineDelegator } from "../../engine/framework/engine";
import { Good } from "../../engine/state/good";

/**
 * Alabama Railways setup has to be reproducible from the seed.
 *
 * The engine's convention is that the bag is shuffled once with the seeded
 * generator and then drawn from deterministically, so a game's setup is fixed by
 * its seed. This map used to pick its goods growth cubes with Math.random(),
 * which no seed can control.
 */
describe("Alabama Railways setup", () => {
  const GAME_KEY = "alabama-railways";

  function start(seed: string) {
    return JSON.parse(
      EngineDelegator.singleton.start({
        game: { id: 1, gameKey: GAME_KEY, variant: {} },
        players: [{ playerId: 1 }, { playerId: 2 }],
        seed,
      }).gameData,
    ).gameData;
  }

  it("deals the same board every time for a given seed", () => {
    for (const seed of ["a", "b", "c"]) {
      expect(start(seed)).toEqual(start(seed));
    }
  });

  it("deals a different board for a different seed", () => {
    expect(start("seed-a")).not.toEqual(start("seed-b"));
  });

  it("never puts a city's own colour in its goods growth, except black", () => {
    // The rule the original sampling loop implemented, preserved by the scan
    // that replaced it.
    const state = start("colours");
    for (const [, space] of state.grid as Array<
      [unknown, { color?: Good | Good[]; onRoll?: Array<{ goods: Good[] }> }]
    >) {
      if (space.onRoll == null || space.color == null) continue;
      const own = Array.isArray(space.color) ? space.color : [space.color];
      for (const onRoll of space.onRoll) {
        for (const good of onRoll.goods) {
          if (good === Good.BLACK) continue;
          expect(own).not.toContain(good);
        }
      }
    }
  });

  it("never deals the goods this map removes from the bag", () => {
    const state = start("bag");
    const inBag = state.bag as Good[];

    expect(inBag).not.toContain(Good.YELLOW);
    expect(inBag).not.toContain(Good.PURPLE);
  });
});
