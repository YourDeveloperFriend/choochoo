import { describe, expect, it } from "vitest";
import { ProductionAction } from "../../engine/goods_growth/production";
import { DoneAction } from "../../engine/build/done";
import { MovePassAction } from "../../engine/move/pass";
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
 * display is still exactly as it was dealt when production runs.
 */
function toProduction(game: TestGame): TestGame {
  const actions = [Action.PRODUCTION, Action.FIRST_BUILD, Action.FIRST_MOVE];
  let guard = 0;
  while (game.phase !== Phase.GOODS_GROWTH && guard++ < 200) {
    switch (game.phase) {
      case Phase.SHARES:
        game.emit(TakeSharesAction, { numShares: 0 });
        break;
      case Phase.TURN_ORDER:
        game.emit(TurnOrderPassAction, {});
        break;
      case Phase.ACTION_SELECTION:
        game.emit(SelectAction, { action: actions.shift()! });
        break;
      case Phase.BUILDING:
        game.emit(DoneAction, {});
        break;
      case Phase.MOVING:
        game.emit(MovePassAction, {});
        break;
      default:
        throw new Error(`Unexpected phase ${game.phaseName}`);
    }
  }
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
    expect(column(game, "Honolulu").onRoll).toHaveLength(6);
  });

  it("moves every cube in the chosen column into its city", () => {
    const game = toProduction(newGame());

    const before = game.snapshot().spaces.find((s) => s.name === "Kaneohe")!;
    const waiting = before.onRoll!;
    expect(waiting).toHaveLength(3);

    // Kaneohe is the white 1 city. The good and the row are ignored.
    game.emit(ProductionAction, {
      urbanized: false,
      cityGroup: CityGroup.WHITE,
      onRoll: 1,
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
        onRoll: 3,
        row: 0,
        good: 0,
      });

    // No city sits in the white 3 column on this map.
    expect(emptyColumn).toThrow();
  });

  it("does not roll dice or refill the display", () => {
    const game = toProduction(newGame());
    game.emit(ProductionAction, {
      urbanized: false,
      cityGroup: CityGroup.WHITE,
      onRoll: 1,
      row: 0,
      good: 0,
    });

    expect(game.logs.join("\n")).not.toContain("rolled");
    expect(column(game, "Kaneohe").onRoll).toEqual([]);
  });
});
