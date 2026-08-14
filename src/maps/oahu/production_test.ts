import { describe, expect, it } from "vitest";
import { ProductionAction } from "../../engine/goods_growth/production";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { PassAction as TurnOrderPassAction } from "../../engine/turn_order/pass";
import { startGame, TestGame } from "../../testing/harness/test_game";
import { OahuMapSettings } from "./settings";

const { RED, BLUE, GREEN } = PlayerColor;

function newGame(seed = "oahu-production"): TestGame {
  return startGame(new OahuMapSettings().key, {
    players: [RED, BLUE, GREEN],
    seed,
  });
}

/**
 * Plays the opening phases without building or moving anything, so the goods
 * display is still exactly as it was dealt when production runs. Stops right
 * after the first player selects Production, which resolves immediately
 * during action selection instead of waiting for a later phase.
 */
function toProduction(game: TestGame): TestGame {
  let guard = 0;
  while (game.phase !== Phase.ACTION_SELECTION && guard++ < 200) {
    switch (game.phase) {
      case Phase.SHARES:
        game.emit(TakeSharesAction, { numShares: 0 });
        break;
      case Phase.TURN_ORDER:
        game.emit(TurnOrderPassAction, {});
        break;
      default:
        throw new Error(`Unexpected phase ${game.phaseName}`);
    }
  }
  game.emit(SelectAction, { action: Action.PRODUCTION });
  return game;
}

/** The city occupying a goods display column, and what is waiting in it. */
function column(game: TestGame, cityName: string) {
  const space = game
    .snapshot()
    .spaces.find((space) => space.name === cityName)!;
  return { label: space.label, onRoll: space.onRoll ?? [] };
}

describe("O'ahu production", () => {
  it("starts every on-map city column with three cubes", () => {
    const game = newGame();

    expect(column(game, "Kaneohe").onRoll).toHaveLength(3);
    expect(column(game, "Honolulu").onRoll).toHaveLength(3);
  });

  it("moves every cube in the chosen column into its city", () => {
    const game = toProduction(newGame());

    const before = game.snapshot().spaces.find((s) => s.name === "Kaneohe")!;
    const waiting = before.onRoll!;
    expect(waiting).toHaveLength(3);

    // Kaneohe is the white 5 city. The good and the row are ignored.
    game.emit(ProductionAction, {
      urbanized: false,
      cityGroup: CityGroup.WHITE,
      onRoll: 5,
      row: 0,
      good: 0,
    });

    const after = game.snapshot().spaces.find((s) => s.name === "Kaneohe")!;
    expect(after.onRoll ?? []).toEqual([]);
    expect(after.goods).toEqual(
      [...(before.goods ?? []), ...waiting].sort((a, b) => (a < b ? -1 : 1)),
    );
  });

  it("rejects a column that has no cubes left", () => {
    const game = toProduction(newGame());

    const emptyColumn = () =>
      game.emit(ProductionAction, {
        urbanized: false,
        cityGroup: CityGroup.WHITE,
        onRoll: 2,
        row: 0,
        good: 0,
      });

    // No city sits in the white 2 column on this map.
    expect(emptyColumn).toThrow();
  });

  it("does not roll dice or refill the display", () => {
    const game = toProduction(newGame());
    game.emit(ProductionAction, {
      urbanized: false,
      cityGroup: CityGroup.WHITE,
      onRoll: 5,
      row: 0,
      good: 0,
    });

    expect(game.logs.join("\n")).not.toContain("rolled");
    expect(column(game, "Kaneohe").onRoll).toEqual([]);
  });

  it("moves cubes into a New City that has not been urbanized yet", () => {
    const game = toProduction(newGame());

    // White 3 is a New City (Available City) column, separate from Ewa's
    // grid column which happens to share the same group/onRoll.
    const before = game.availableCities.find((city) =>
      city.onRoll.some(
        (onRoll) => onRoll.group === CityGroup.WHITE && onRoll.onRoll === 3,
      ),
    )!;
    const waiting = before.onRoll[0].goods.filter((good) => good != null);
    expect(waiting.length).toBeGreaterThan(0);

    game.emit(ProductionAction, {
      urbanized: true,
      cityGroup: CityGroup.WHITE,
      onRoll: 3,
      row: 0,
      good: 0,
    });

    const after = game.availableCities.find((city) =>
      city.onRoll.some(
        (onRoll) => onRoll.group === CityGroup.WHITE && onRoll.onRoll === 3,
      ),
    )!;
    expect(after.onRoll[0].goods).toEqual([]);
    expect(after.goods).toEqual(
      [...before.goods, ...waiting].sort((a, b) => (a < b ? -1 : 1)),
    );

    // Ewa's grid column, sharing the same group/onRoll, is untouched.
    const ewa = game.snapshot().spaces.find((s) => s.name === "Ewa")!;
    expect(ewa.onRoll).toHaveLength(3);
  });
});
