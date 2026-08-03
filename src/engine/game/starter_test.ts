import { EngineDelegator } from "../framework/engine";
import { PlayerUser } from "./starter";
import { PlayerColor } from "../state/player";

/**
 * Setting up a game must depend only on the seed, not on the players.
 *
 * The seeded generator is a stream: a seed fixes a sequence of values, so any
 * draw only reproduces if the same number of draws preceded it. Colour
 * preferences are read from the users when a game starts and are not recorded
 * anywhere, so if the number of values consumed varied with them, a finished
 * game could not be replayed from its seed.
 */
describe("game setup determinism", () => {
  const { RED, BLUE, GREEN } = PlayerColor;
  const BOARD_KEYS = ["grid", "bag", "availableCities", "interCityConnections"];

  function board(gameKey: string, players: PlayerUser[], seed: string): string {
    const state = JSON.parse(
      EngineDelegator.singleton.start({
        game: { id: 1, gameKey, variant: {} },
        players,
        seed,
      }).gameData,
    ).gameData as Record<string, unknown>;
    return JSON.stringify(BOARD_KEYS.map((key) => state[key]));
  }

  function threePlayers(preferences: Array<PlayerColor[] | undefined>) {
    return preferences.map((preferredColors, index) => ({
      playerId: index + 1,
      ...(preferredColors == null ? {} : { preferredColors }),
    }));
  }

  const none = threePlayers([undefined, undefined, undefined]);
  const all = threePlayers([[RED], [BLUE], [GREEN]]);
  const some = threePlayers([[RED], undefined, undefined]);

  describe("on a map that draws only while dealing the board", () => {
    it("deals the same board however many players set a preference", () => {
      const baseline = board("rust-belt", none, "determinism");

      expect(board("rust-belt", all, "determinism")).toEqual(baseline);
      expect(board("rust-belt", some, "determinism")).toEqual(baseline);
    });
  });

  describe("on Chicago L, which draws for the board after setup", () => {
    // Chicago L is the one map that draws for the board after the players are
    // assigned: onStartGame deals the Loop demand and picks the government's
    // starting city. That made its board move with the preferences, and it is
    // why player setup has to consume a fixed amount -- with that fixed, the
    // draws land at the same place in the stream regardless.
    it("deals the same board however many players set a preference", () => {
      const baseline = board("chicago-l", none, "determinism");

      expect(board("chicago-l", all, "determinism")).toEqual(baseline);
      expect(board("chicago-l", some, "determinism")).toEqual(baseline);
    });

    it("still deals a different board for a different seed", () => {
      expect(board("chicago-l", none, "seed-a")).not.toEqual(
        board("chicago-l", none, "seed-b"),
      );
    });
  });

  describe("player assignment", () => {
    it("consumes the same randomness however many players set a preference", () => {
      // The order players are processed in comes from one shuffle over all of
      // them, so it does not depend on how many expressed a preference. When
      // only the players with preferences were shuffled, the number of values
      // consumed varied with that count and shifted every later draw -- which
      // is what stopped a finished game being replayable from its seed.
      const order = (players: PlayerUser[]) =>
        (
          JSON.parse(
            EngineDelegator.singleton.start({
              game: { id: 1, gameKey: "rust-belt", variant: {} },
              players,
              seed: "consumption",
            }).gameData,
          ).gameData.players as Array<{ playerId: number }>
        ).map((player) => player.playerId);

      expect(order(none)).toEqual(order(all));
    });

    it("is reproducible from the same seed and players", () => {
      expect(board("rust-belt", all, "repro")).toEqual(
        board("rust-belt", all, "repro"),
      );
    });

    it("honours a preference that is still available", () => {
      const state = JSON.parse(
        EngineDelegator.singleton.start({
          game: { id: 1, gameKey: "rust-belt", variant: {} },
          players: all,
          seed: "colors",
        }).gameData,
      ).gameData;
      const players = state.players as Array<{
        playerId: number;
        color: PlayerColor;
      }>;

      expect(players.find((p) => p.playerId === 1)!.color).toEqual(RED);
      expect(players.find((p) => p.playerId === 2)!.color).toEqual(BLUE);
      expect(players.find((p) => p.playerId === 3)!.color).toEqual(GREEN);
    });

    it("still gives everyone a distinct colour when preferences collide", () => {
      const state = JSON.parse(
        EngineDelegator.singleton.start({
          game: { id: 1, gameKey: "rust-belt", variant: {} },
          players: threePlayers([[RED], [RED], [RED]]),
          seed: "collide",
        }).gameData,
      ).gameData;
      const colors = (state.players as Array<{ color: PlayerColor }>).map(
        (p) => p.color,
      );

      expect(new Set(colors).size).toEqual(3);
      expect(colors).toContain(RED);
    });
  });
});
