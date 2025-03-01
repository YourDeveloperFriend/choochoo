import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { GameApi, GameStatus } from "../../api/game";
import { GameKey } from "../../api/game_key";
import { SimpleConstructor } from "../../engine/framework/dependency_stack";
import {
  inject,
  injectState,
  setInjectionContext,
} from "../../engine/framework/execution_context";
import { InjectionContext } from "../../engine/framework/inject";
import { Key } from "../../engine/framework/key";
import { StateStore } from "../../engine/framework/state";
import { GameMemory, toLimitedGame } from "../../engine/game/game_memory";
import { PHASE } from "../../engine/game/phase";
import { injectCurrentPlayer, injectGrid } from "../../engine/game/state";
import { Grid } from "../../engine/map/grid";
import { Phase } from "../../engine/state/phase";
import { PlayerData } from "../../engine/state/player";
import { ViewRegistry } from "../../maps/view_registry";
import { MapViewSettings } from "../../maps/view_settings";
import { Immutable } from "../../utils/immutable";
import { assert } from "../../utils/validate";
import { useGame } from "../services/game";

export const InjectionContextContext = createContext<
  InjectionContext | undefined
>(undefined);
export const MapKeyContext = createContext<GameKey | undefined>(undefined);

function useInjectionContext(): InjectionContext {
  const ctx = useContext(InjectionContextContext);
  assert(ctx != null);
  return ctx;
}

interface InjectionContextProps {
  game: GameApi;
  children: ReactNode;
}

export function useInjected<T>(factory: SimpleConstructor<T>): T {
  return useInject(() => {
    // Wrap in an object so the value changes every time (notifying react of the diff).
    return { value: inject(factory) };
  }, [factory]).value;
}

export interface Memoized<T> {
  value: T;
}

export function useInjectedMemo<T>(factory: SimpleConstructor<T>): Memoized<T> {
  return useInject(() => {
    // Wrap in an object so the value changes every time (notifying react of the diff).
    return { value: inject(factory) };
  }, [factory]);
}

export function useInject<T>(fn: () => T, deps: unknown[]): T {
  const ctx = useInjectionContext();

  const [incrementedValue, incrValue] = useReducer((i) => i + 1, 1);

  const [value, stateDeps] = useMemo(() => {
    setInjectionContext(ctx);
    try {
      const [value, dependencies] = ctx.runFunction(fn);
      setInjectionContext();
      return [value, ctx.getStateDependencies(...dependencies)];
    } finally {
      setInjectionContext();
    }
  }, [ctx, incrementedValue, ...deps]);

  useEffect(() => {
    return ctx.get(StateStore).listenAll(stateDeps, () => {
      incrValue();
    });
  }, [ctx, incrValue, ...stateDeps]);

  return value;
}

export function GameContextProvider({ game, children }: InjectionContextProps) {
  const ctx = useMemo(() => {
    const ctx = new InjectionContext(game.gameKey);
    setInjectionContext(ctx);
    const memory = ctx.get(GameMemory);
    memory.setGame(toLimitedGame(game));
    try {
      ctx.get(StateStore).merge(game.gameData!);
      return ctx;
    } finally {
      setInjectionContext();
    }
  }, [game.id]);

  useEffect(() => {
    ctx.get(StateStore).merge(game.gameData!);
  }, [ctx, game.gameData]);

  return (
    <InjectionContextContext.Provider value={ctx}>
      <MapKeyContext.Provider value={game.gameKey}>
        {children}
      </MapKeyContext.Provider>
    </InjectionContextContext.Provider>
  );
}

export function useGameKey(): GameKey {
  return useContext(MapKeyContext)!;
}

export function useViewSettings(): MapViewSettings {
  const gameKey = useGameKey();
  return useMemo(() => ViewRegistry.singleton.get(gameKey), [gameKey]);
}

export function usePhaseState<T>(
  phase: Phase,
  key: Key<T>,
): Immutable<T> | undefined {
  const currentPhase = useActiveGameState(PHASE);
  return useOptionalInjectedState(key, phase === currentPhase);
}

function useOptionalInjectedState<T>(
  key: Key<T>,
  optionalCheck: boolean,
): Immutable<T> | undefined {
  const ctx = useInjectionContext();
  setInjectionContext(ctx);
  const [injectedState] = ctx.runFunction(() => injectState(key));
  setInjectionContext();

  const [_, setValue] = useState<Immutable<T> | undefined>(() =>
    optionalCheck ? injectedState() : undefined,
  );

  useEffect(() => {
    if (!optionalCheck) return;
    return injectedState.listen((newValue) => {
      setValue(newValue);
    });
  }, [ctx, optionalCheck]);

  if (optionalCheck) {
    return injectedState();
  }
  return undefined;
}

export function useActiveGameState<T>(key: Key<T>): Immutable<T> | undefined {
  const game = useGame();
  return useOptionalInjectedState(key, game.status === GameStatus.enum.ACTIVE)!;
}

export function useInjectedState<T>(key: Key<T>): Immutable<T> {
  return useOptionalInjectedState(key, true)!;
}

export function useCurrentPlayer(): PlayerData | undefined {
  return useInject(() => {
    const phase = injectState(PHASE)();
    if (phase === Phase.END_GAME) return undefined;
    return injectCurrentPlayer()();
  }, []);
}

export function useGrid(): Grid {
  return useInject(() => injectGrid()(), []);
}
