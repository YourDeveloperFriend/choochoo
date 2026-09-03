import { describe, expect, it } from "vitest";
import { GameDao } from "./dao";

/**
 * setNotesForUser writes into notes[index] directly, where index is the
 * player's position in playerIds. Exercised as a plain object rather than a
 * real Sequelize instance so the test doesn't need a database connection;
 * `changed` is only used for Sequelize's dirty tracking, so it's stubbed out.
 */
describe("GameDao#setNotesForUser", () => {
  function fakeGame(playerIds: number[], notes: Array<string | null> | null) {
    return Object.assign(Object.create(GameDao.prototype), {
      playerIds,
      notes,
      changed: () => {},
    }) as GameDao;
  }

  it("sets notes for the first player", () => {
    const game = fakeGame([10, 20, 30], null);

    game.setNotesForUser(10, "hello");

    expect(game.notes).toEqual(["hello"]);
  });

  it("backfills earlier players with null instead of leaving array holes", () => {
    const game = fakeGame([10, 20, 30], null);

    game.setNotesForUser(30, "hello");

    // A sparse array (e.g. from `arr[2] = x` on an empty array) has `undefined`
    // holes, which fail Sequelize's ARRAY(TEXT) validation. Explicit nulls
    // don't.
    expect(game.notes).toEqual([null, null, "hello"]);
    expect(1 in (game.notes as unknown[])).toBe(true);
  });

  it("overwrites an existing note for that player without disturbing others", () => {
    const game = fakeGame([10, 20, 30], ["a", "b", "c"]);

    game.setNotesForUser(20, "updated");

    expect(game.notes).toEqual(["a", "updated", "c"]);
  });

  it("rejects a user who isn't a player in the game", () => {
    const game = fakeGame([10, 20, 30], null);

    expect(() => game.setNotesForUser(999, "hello")).toThrow();
  });
});
