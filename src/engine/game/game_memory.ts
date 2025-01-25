import type { InferAttributes } from "@sequelize/core";
import type { GameApi } from "../../api/game";
import type { GameDao } from "../../server/game/dao";
import { assert } from "../../utils/validate";
import { inject } from "../framework/execution_context";
import { Memory } from "./memory";

export interface LimitedGame {
  gameKey: string;
  gameData?: string;
}

export class GameMemory {
  private readonly game = inject(Memory).remember<LimitedGame | undefined>(
    undefined,
  );

  setGame(game: LimitedGame) {
    this.game.set(game);
  }

  getGame(): LimitedGame {
    const game = this.game();
    assert(game != null);
    return game;
  }
}

export function toLimitedGame(
  game: GameApi | InferAttributes<GameDao>,
): LimitedGame {
  return {
    gameKey: game.gameKey ?? undefined,
    gameData: game.gameData ?? undefined,
  };
}
