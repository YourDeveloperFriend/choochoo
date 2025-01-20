import { MapRegistry } from "../../maps";
import { assert } from "../../utils/validate";
import { AutoActionManager, AutoActionMutationConfig } from "../game/auto_action_manager";
import { GameEngine } from "../game/game";
import { Log } from "../game/log";
import { Memory } from "../game/memory";
import { PHASE } from "../game/phase";
import { Random } from "../game/random";
import { ROUND, RoundEngine } from "../game/round";
import { injectCurrentPlayer } from "../game/state";
import { MOVE_STATE } from "../move/state";
import { getPhaseString, Phase } from "../state/phase";
import { SimpleConstructor } from "./dependency_stack";
import { inject, injectState, setInjectionContext } from "./execution_context";
import { InjectionContext } from "./inject";
import { StateStore } from "./state";

interface MapConfig {
  mapKey: string;
}

interface GameState {
  activePlayerId?: number;
  hasEnded: boolean;
  gameData: string;
  reversible: boolean;
  logs: string[];
  autoActionMutations: AutoActionMutationConfig[];
  seed: string | undefined;
}

export class EngineDelegator {
  static readonly singleton = new EngineDelegator();
  private readonly engines = new Map<string, EngineProcessor>();

  private constructor() { }

  private getEngine(mapKey: string): EngineProcessor {
    if (!this.engines.has(mapKey)) {
      try {
        const injectionContext = new InjectionContext(mapKey);

        setInjectionContext(injectionContext);
        this.engines.set(mapKey, injectionContext.get(EngineProcessor));
      } finally {
        setInjectionContext();
      }
    }
    return this.engines.get(mapKey)!;
  }

  start(props: StartProps): GameState {
    return this.getEngine(props.mapConfig.mapKey).start(props);
  }

  processAction(mapKey: string, props: ProcessActionProps): GameState {
    return this.getEngine(mapKey).processAction(props);
  }

  readSummary(mapKey: string, gameData: string): string {
    return this.getEngine(mapKey).readSummary(gameData);
  }
}


interface StartProps {
  playerIds: number[];
  mapConfig: MapConfig;
  seed?: string;
}

interface ProcessActionProps {
  gameData: string;
  actionName: string;
  actionData: unknown;
  seed?: string;
}

export class EngineProcessor {
  private readonly gameEngine = inject(GameEngine);
  private readonly state = inject(StateStore);
  private readonly random = inject(Random);
  private readonly log = inject(Log);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly memory = inject(Memory);
  private readonly round = injectState(ROUND);
  private readonly roundEngine = inject(RoundEngine);
  private readonly phase = injectState(PHASE);
  private readonly moveState = injectState(MOVE_STATE);
  private readonly autoActionManager = inject(AutoActionManager);

  start({ mapConfig, playerIds, seed }: StartProps): GameState {
    return this.process(undefined, () => {
      this.random.setSeed(seed);
      const mapSettings = MapRegistry.singleton.get(mapConfig.mapKey);
      assert(playerIds.length >= mapSettings.minPlayers, { invalidInput: 'not enough players to start' });
      this.gameEngine.start(playerIds, mapSettings.startingGrid, mapSettings.interCityConnections ?? []);
      return this.getGameState();
    });
  }

  processAction({ gameData, actionName, actionData, seed }: ProcessActionProps): GameState {
    return this.process(gameData, () => {
      this.random.setSeed(seed);
      this.gameEngine.processAction(actionName, actionData);
      return this.getGameState();
    });
  }

  readSummary(gameData: string): string {
    return this.process(gameData, () => {
      return [
        `Turn ${this.round()}/${this.roundEngine.maxRounds()}`,
        this.phase() === Phase.MOVING
          ? `Move goods round ${this.moveState().moveRound + 1}`
          : getPhaseString(this.phase()),
      ].join(' - ');
    });
  }

  private process<T>(gameData: string | undefined, processFn: () => T): T {
    try {
      if (gameData != null) {
        this.state.merge(gameData);
      }
      return processFn();
    } finally {
      this.memory.reset();
    }
  }

  private getGameState(): GameState {
    return {
      activePlayerId: this.gameEngine.hasEnded() ? undefined : this.currentPlayer().playerId,
      hasEnded: this.gameEngine.hasEnded(),
      gameData: this.state.serialize(),
      reversible: this.random.isReversible(),
      logs: this.log.dump(),
      autoActionMutations: this.autoActionManager.getMutations(),
      seed: this.random.getSeed(),
    };
  }
}

export class InjectionRunner {
  private static readonly ctxs = new Map<string, InjectionContext>();

  private constructor() { }

  private static getInjectionContext(mapKey: string): InjectionContext {
    if (!this.ctxs.has(mapKey)) {
      this.ctxs.set(mapKey, new InjectionContext(mapKey));
    }
    return this.ctxs.get(mapKey)!;
  }

  static runFunction<T>(mapKey: string, gameData: string | undefined, fn: () => T): T {
    const ctx = this.getInjectionContext(mapKey);
    try {
      setInjectionContext(ctx);
      if (gameData != null) {
        ctx.get(StateStore).merge(gameData);
      }
      return fn();
    } finally {
      ctx.get(Memory).reset();
      setInjectionContext();
    }
  }

  static get<T>(mapKey: string, gameData: string | undefined, ctor: SimpleConstructor<T>): T {
    return this.runFunction(mapKey, gameData, () => inject(ctor));
  }
}