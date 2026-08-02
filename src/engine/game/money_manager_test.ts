import { describe, expect, it } from "vitest";
import { city, plain } from "../../testing/factory";
import { InjectionHelper } from "../../testing/injection_helper";
import { resettable } from "../../testing/resettable";
import { Coordinates } from "../../utils/coordinates";
import { PlayerColor, PlayerData } from "../state/player";
import { LandData, MutableSpaceData } from "../state/space";
import { Direction, SimpleTileType } from "../state/tile";
import { MoneyManager } from "./money_manager";
import {
  GRID,
  INTER_CITY_CONNECTIONS,
  TEST_ONLY_PLAYERS,
  TURN_ORDER,
} from "./state";

describe("MoneyManager", () => {
  const injector = InjectionHelper.install();

  const COLOR = PlayerColor.BLUE;

  const players = injector.initResettableState(TEST_ONLY_PLAYERS, [
    { color: COLOR, money: 5 } as PlayerData,
  ]);
  const turnOrder = injector.initResettableState(TURN_ORDER, []);
  const grid = injector.initResettableState(GRID, new Map([]));
  injector.initResettableState(INTER_CITY_CONNECTIONS, []);

  const manager = resettable(() => new MoneyManager());

  function playerData(data: Partial<PlayerData>): PlayerData {
    return { color: COLOR, ...data } as PlayerData;
  }

  describe("addMoney", () => {
    it("adds money to the given user", () => {
      players.set([playerData({ money: 4 })]);
      const result = manager().addMoney(COLOR, 5);

      expect(result).toEqual({ lostIncome: 0, outOfGame: false });
      expect(players()).toEqual([playerData({ money: 9 })]);
    });

    it("removes money for a given expense", () => {
      players.set([playerData({ money: 4 })]);
      const result = manager().addMoney(COLOR, -3);

      expect(result).toEqual({ lostIncome: 0, outOfGame: false });
      expect(players()).toEqual([playerData({ money: 1 })]);
    });

    it("removes money and income for a forced expense", () => {
      players.set([playerData({ money: 4, income: 9 })]);
      const result = manager().addMoney(COLOR, -7, true);

      expect(result).toEqual({ lostIncome: 3, outOfGame: false });
      expect(players()).toEqual([playerData({ money: 0, income: 6 })]);
    });

    it("takes a player to nearly bankrupt", () => {
      players.set([playerData({ money: 4, income: 9 })]);
      const result = manager().addMoney(COLOR, -13, true);

      expect(result).toEqual({ lostIncome: 9, outOfGame: false });
      expect(players()).toEqual([playerData({ money: 0, income: 0 })]);
    });

    it("takes a player out of the game", () => {
      turnOrder.set([PlayerColor.RED, COLOR, PlayerColor.GREEN]);
      players.set([playerData({ money: 4, income: 9 })]);
      const result = manager().addMoney(COLOR, -14, true);

      expect(result).toEqual({ lostIncome: 10, outOfGame: true });
      expect(players()).toEqual([
        playerData({ money: 0, income: -1, outOfGame: true }),
      ]);
      expect(turnOrder()).toEqual([PlayerColor.RED, PlayerColor.GREEN]);
    });

    it("a bankrupt player loses its track", () => {
      const firstCity = Coordinates.from({ q: 0, r: 0 });
      const first = firstCity.neighbor(Direction.TOP);
      const second = first.neighbor(Direction.TOP);
      const secondCity = second.neighbor(Direction.TOP);
      grid.set(
        new Map<Coordinates, MutableSpaceData>([
          [firstCity, city()],
          [
            first,
            plain({
              tile: {
                tileType: SimpleTileType.STRAIGHT,
                orientation: Direction.TOP,
                owners: [COLOR],
              },
            }),
          ],
          [
            second,
            plain({
              tile: {
                tileType: SimpleTileType.STRAIGHT,
                orientation: Direction.TOP,
                owners: [COLOR],
              },
            }),
          ],
          [secondCity, city()],
        ]),
      );

      players.set([playerData({ money: 0, income: 0 })]);
      manager().addMoney(COLOR, -1, true);

      expect((grid().get(first) as LandData).tile!.owners).toEqual([undefined]);
      expect((grid().get(second) as LandData).tile!.owners).toEqual([
        undefined,
      ]);
    });
  });
});
