import { describe, expect, it } from "vitest";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { PassAction as TurnOrderPassAction } from "../../engine/turn_order/pass";
import { startGame, TestGame } from "../../testing/harness/test_game";
import { OahuProductionAction } from "./production";
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
  it("starts every on-map city column with two cubes, and new city columns empty", () => {
    const game = newGame();

    expect(column(game, "Kaneohe").onRoll).toHaveLength(2);
    expect(column(game, "Honolulu").onRoll).toHaveLength(2);

    const ewaGroup = game.availableCities.find((city) =>
      city.onRoll.some(
        (onRoll) => onRoll.group === CityGroup.WHITE && onRoll.onRoll === 3,
      ),
    )!;
    expect(ewaGroup.onRoll[0].goods).toEqual([]);
  });

  it("moves every cube in the chosen column into the Starting City", () => {
    const game = toProduction(newGame());

    const before = game.snapshot().spaces.find((s) => s.name === "Kaneohe")!;
    const waiting = before.onRoll!;
    expect(waiting).toHaveLength(2);

    // Kaneohe is the white 5 city.
    game.emit(OahuProductionAction, {
      cityGroup: CityGroup.WHITE,
      onRoll: 5,
      toNewCity: false,
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
      game.emit(OahuProductionAction, {
        cityGroup: CityGroup.WHITE,
        onRoll: 2,
        toNewCity: false,
      });

    // No city sits in the white 2 column on this map.
    expect(emptyColumn).toThrow();
  });

  it("does not roll dice or refill the display", () => {
    const game = toProduction(newGame());
    game.emit(OahuProductionAction, {
      cityGroup: CityGroup.WHITE,
      onRoll: 5,
      toNewCity: false,
    });

    expect(game.logs.join("\n")).not.toContain("rolled");
    expect(column(game, "Kaneohe").onRoll).toEqual([]);
  });

  it("moves cubes into a New City that has not been urbanized yet", () => {
    const game = toProduction(newGame());

    // White 3 is a New City (Available City) column, separate from Ewa's
    // grid column which happens to share the same group/onRoll. New City
    // columns start empty, so the cubes come from Ewa's own column.
    const ewaBefore = game.snapshot().spaces.find((s) => s.name === "Ewa")!;
    const waiting = ewaBefore.onRoll!;
    expect(waiting.length).toBeGreaterThan(0);

    const beforeAvailable = game.availableCities.find((city) =>
      city.onRoll.some(
        (onRoll) => onRoll.group === CityGroup.WHITE && onRoll.onRoll === 3,
      ),
    )!;

    game.emit(OahuProductionAction, {
      cityGroup: CityGroup.WHITE,
      onRoll: 3,
      toNewCity: true,
    });

    const ewaAfter = game.snapshot().spaces.find((s) => s.name === "Ewa")!;
    expect(ewaAfter.onRoll ?? []).toEqual([]);

    const afterAvailable = game.availableCities.find((city) =>
      city.onRoll.some(
        (onRoll) => onRoll.group === CityGroup.WHITE && onRoll.onRoll === 3,
      ),
    )!;
    expect(afterAvailable.onRoll[0].goods).toEqual([]);
    expect(afterAvailable.goods.map(goodToString).sort()).toEqual(
      [...beforeAvailable.goods.map(goodToString), ...waiting].sort(),
    );
  });
});
