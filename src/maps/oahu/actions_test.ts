import { describe, expect, it } from "vitest";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { PassAction as TurnOrderPassAction } from "../../engine/turn_order/pass";
import { startGame, TestGame } from "../../testing/harness/test_game";
import { OahuProductionAction } from "./production";
import { OahuMapSettings } from "./settings";

const { RED, BLUE, GREEN } = PlayerColor;

function newGame(seed = "oahu-actions"): TestGame {
  return startGame(new OahuMapSettings().key, {
    players: [RED, BLUE, GREEN],
    seed,
  });
}

/** Runs the shares and turn order phases so the game reaches action selection. */
function toActionSelection(game: TestGame): TestGame {
  while (game.phase !== Phase.ACTION_SELECTION) {
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
  return game;
}

/** Kaneohe's column: white group, on-roll 5, with cubes at the start of the game. */
function pickKaneohe(game: TestGame): void {
  game.emit(OahuProductionAction, {
    cityGroup: CityGroup.WHITE,
    onRoll: 5,
    row: 0,
  });
}

describe("O'ahu forced Production selection", () => {
  it("forces the last player in turn order into Production if nobody else picked it", () => {
    const game = toActionSelection(newGame());
    const [first, second, last] = game.turnOrder;

    expect(game.currentPlayer).toBe(first);
    game.emit(SelectAction, { action: Action.FIRST_BUILD });
    expect(game.currentPlayer).toBe(second);
    game.emit(SelectAction, { action: Action.FIRST_MOVE });

    // The engine auto-applies the forced selection without any emit, but the
    // turn stays open until the column pick that Production requires.
    expect(game.currentPlayer).toBe(last);
    expect(game.player(last).selectedAction).toBe(Action[Action.PRODUCTION]);
    expect(game.phase).toBe(Phase.ACTION_SELECTION);

    pickKaneohe(game);
    expect(game.phase).not.toBe(Phase.ACTION_SELECTION);
  });

  it("does not force Production on the last player if someone already picked it", () => {
    const game = toActionSelection(newGame());
    const [first, second, last] = game.turnOrder;

    expect(game.currentPlayer).toBe(first);
    game.emit(SelectAction, { action: Action.PRODUCTION });
    expect(game.player(first).selectedAction).toBe(Action[Action.PRODUCTION]);
    expect(game.currentPlayer).toBe(first);

    pickKaneohe(game);
    expect(game.currentPlayer).toBe(second);
    game.emit(SelectAction, { action: Action.FIRST_BUILD });

    expect(game.currentPlayer).toBe(last);
    expect(game.player(last).selectedAction).toBeUndefined();
    game.emit(SelectAction, { action: Action.FIRST_MOVE });
    expect(game.player(last).selectedAction).toBe(Action[Action.FIRST_MOVE]);
  });
});
