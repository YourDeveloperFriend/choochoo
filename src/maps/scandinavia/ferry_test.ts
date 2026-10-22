import { describe, expect, it } from "vitest";
import { DoneAction } from "../../engine/build/done";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePassAction } from "../../engine/move/pass";
import { SelectAction } from "../../engine/select_action/select";
import { TakeSharesAction } from "../../engine/shares/take_shares";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { SpaceType } from "../../engine/state/location_type";
import { PassAction } from "../../engine/turn_order/pass";
import { TestGame, startGame } from "../../testing/harness/test_game";
import { map } from "./grid";
import { ScandinaviaMapData } from "./map_data";
import { ScandinaviaMapSettings } from "./settings";

const { RED, BLUE, GREEN } = PlayerColor;

// Derived from the same isCoastal flag the validator reads, so the test cannot
// drift from the grid. Towns are excluded: only cities can be ferry endpoints.
const COASTAL_CITIES = [...map.values()].flatMap((space) =>
  space.type === SpaceType.CITY &&
  ScandinaviaMapData.parse(space.mapSpecific ?? {}).isCoastal
    ? [space.name]
    : [],
);

/** Plays the opening phases up to move goods round 1, with the first player on Ferry. */
function toMoving(seed: string): TestGame {
  const game = startGame(new ScandinaviaMapSettings().key, {
    players: [RED, BLUE, GREEN],
    seed,
  });
  const actions = [Action.FERRY, Action.FIRST_BUILD, Action.FIRST_MOVE];
  let guard = 0;
  while (game.phase !== Phase.MOVING && guard++ < 100) {
    switch (game.phase) {
      case Phase.SHARES:
        game.emit(TakeSharesAction, { numShares: 0 });
        break;
      case Phase.TURN_ORDER:
        game.emit(PassAction, {});
        break;
      case Phase.ACTION_SELECTION:
        game.emit(SelectAction, { action: actions.shift()! });
        break;
      case Phase.BUILDING:
        game.emit(DoneAction, {});
        break;
      default:
        throw new Error(`Unexpected phase ${game.phaseName}`);
    }
  }
  return game;
}

/** Every one-step ferry delivery between coastal cities that is currently legal. */
function ferryMoves(game: TestGame): { move: MoveData; error?: string }[] {
  const cities = game.labels
    .map((label) => ({ label, space: game.space(label) }))
    .filter(({ space }) => COASTAL_CITIES.includes(space?.name ?? ""));
  const moves: { move: MoveData; error?: string }[] = [];
  for (const from of cities) {
    for (const good of new Set(from.space?.goods ?? [])) {
      for (const to of cities) {
        if (to === from) continue;
        const move: MoveData = {
          startingCity: game.coord(from.label),
          good: Good[good.toUpperCase() as keyof typeof Good],
          path: [
            {
              endingStop: game.coord(to.label),
              additionalData: { teleport: true },
            },
          ],
        };
        moves.push({ move, error: game.errorFor(MoveAction, move) });
      }
    }
  }
  return moves;
}

describe("Scandinavia ferry", () => {
  it("can be used only once per round across both deliveries", () => {
    const game = toMoving("ferry-once");
    const ferryPlayer = game.turnOrder.find(
      (c) => game.player(c).selectedAction === Action[Action.FERRY],
    )!;
    while (game.currentPlayer !== ferryPlayer) game.emit(MovePassAction, {});

    const first = ferryMoves(game).find((m) => m.error == null);
    expect(first, "seed should offer a legal ferry delivery").toBeDefined();
    game.emit(MoveAction, first!.move);

    // Back around to the ferry player's second delivery.
    while (game.currentPlayer !== ferryPlayer) game.emit(MovePassAction, {});
    expect(game.summary).toContain("Move goods round 2");

    const second = ferryMoves(game);
    expect(second.length).toBeGreaterThan(0);
    expect(second.map((m) => m.error)).toContain(
      "can only use the ferry once per round",
    );
    expect(second.filter((m) => m.error == null)).toEqual([]);
  });
});
