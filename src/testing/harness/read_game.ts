import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { setInjectionContext } from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { StateStore } from "../../engine/framework/state";
import { GameMemory, LimitedGame } from "../../engine/game/game_memory";
import { Memory } from "../../engine/game/memory";

/**
 * A game to read, without requiring a database row. `gameData` is the serialized
 * string produced by `EngineDelegator.start()` / `processAction()`.
 */
export interface ReadableGame {
  gameKey: GameKey;
  gameData: string;
  variant?: VariantConfig;
  id?: number;
}

// Building an InjectionContext walks the whole dependency graph for a map, which
// is slow enough to matter when a suite reads hundreds of states. EngineDelegator
// caches for the same reason.
const contexts = new Map<GameKey, InjectionContext>();

function getContext(gameKey: GameKey): InjectionContext {
  const existing = contexts.get(gameKey);
  if (existing != null) return existing;

  // The context has to be installed while it builds, because constructors call
  // inject()/injectState() against the ambient context.
  try {
    const context = new InjectionContext(gameKey);
    setInjectionContext(context);
    // Force the state store to exist before anything else asks for it.
    context.get(StateStore);
    contexts.set(gameKey, context);
    return context;
  } finally {
    setInjectionContext();
  }
}

/**
 * Opens a serialized game state and runs `fn` with the engine's injectables
 * available, then tears the state back down.
 *
 * This mirrors `EngineProcessor.process`: merge the state, do the work, and
 * always reset memory afterwards so the next read starts clean. Reads are
 * strictly non-mutating -- anything `fn` changes is discarded.
 */
export function readGame<T>(game: ReadableGame, fn: () => T): T {
  const context = getContext(game.gameKey);
  setInjectionContext(context);
  try {
    const limitedGame: LimitedGame = {
      id: game.id ?? 1,
      gameKey: game.gameKey,
      gameData: game.gameData,
      variant: game.variant ?? {},
    };
    context.get(GameMemory).setGame(limitedGame);
    context.get(StateStore).merge(game.gameData);
    return fn();
  } finally {
    // Order matters: reset while the context is still installed, since the
    // memory's resetters were registered against this context's injectables.
    context.get(Memory).reset();
    setInjectionContext();
  }
}
