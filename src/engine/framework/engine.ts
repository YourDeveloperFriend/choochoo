import { GameKey } from "../../api/game_key";
import { MapRegistry } from "../../maps/registry";
import { assert } from "../../utils/validate";
import {
  AutoActionManager,
  AutoActionMutationConfig,
} from "../game/auto_action_manager";
import { GameEngine } from "../game/game";
import { GameMemory, LimitedGame } from "../game/game_memory";
import { Log } from "../game/log";
import { Memory } from "../game/memory";
import { PHASE } from "../game/phase";
import { PlayerHelper } from "../game/player";
import { Random } from "../game/random";
import { ROUND, RoundEngine } from "../game/round";
import { PlayerUser } from "../game/starter";
import { injectCurrentPlayer } from "../game/state";
import { MOVE_STATE } from "../move/state";
import { getPhaseString, Phase } from "../state/phase";
import { inject, injectState, setInjectionContext } from "./execution_context";
import { InjectionContext } from "./inject";
import { StateStore } from "./state";

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

  private constructor() {}

  private getEngine(mapKey: GameKey): EngineProcessor {
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
    return this.getEngine(props.game.gameKey).start(props);
  }

  processAction(mapKey: GameKey, props: ProcessActionProps): GameState {
    return this.getEngine(mapKey).processAction(props);
  }

  readSummary(game: LimitedGame): string {
    return this.getEngine(game.gameKey).readSummary(game);
  }

  inTheLead(game: LimitedGame): number[] {
    return this.getEngine(game.gameKey).inTheLead(game);
  }

  remainingPlayers(game: LimitedGame): number[] {
    return this.getEngine(game.gameKey).remainingPlayers(game);
  }
}

interface StartProps {
  players: PlayerUser[];
  game: LimitedGame;
  seed?: string;
}

interface ProcessActionProps {
  game: LimitedGame;
  actionName: string;
  actionData: unknown;
  seed?: string;
}

export class EngineProcessor {
  private readonly gameEngine = inject(GameEngine);
  private readonly state = inject(StateStore);
  private readonly random = inject(Random);
  private readonly log = inject(Log);
  private readonly playerHelper = inject(PlayerHelper);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly memory = inject(Memory);
  private readonly round = injectState(ROUND);
  private readonly roundEngine = inject(RoundEngine);
  private readonly phase = injectState(PHASE);
  private readonly moveState = injectState(MOVE_STATE);
  private readonly autoActionManager = inject(AutoActionManager);
  private readonly gameMemory = inject(GameMemory);

  start({ game, players, seed }: StartProps): GameState {
    return this.process(game, () => {
      this.random.setSeed(seed);
      const mapSettings = MapRegistry.singleton.get(game.gameKey);
      assert(players.length >= mapSettings.minPlayers, {
        invalidInput: "not enough players to start",
      });
      this.gameEngine.start(
        players,
        mapSettings.startingGrid,
        mapSettings.interCityConnections ?? [],
      );
      return this.getGameState();
    });
  }

  processAction({
    game,
    actionName,
    actionData,
    seed,
  }: ProcessActionProps): GameState {
    return this.process(game, () => {
      this.random.setSeed(seed);
      this.gameEngine.processAction(actionName, actionData);
      return this.getGameState();
    });
  }

  readSummary(game: LimitedGame): string {
    return this.process(game, () => {
      const maxRounds = this.roundEngine.maxRounds();
      const turnStr =
        `Turn ${this.round()}` + (maxRounds != Infinity ? `/${maxRounds}` : "");
      return [
        turnStr,
        this.phase() === Phase.MOVING
          ? `Move goods round ${this.moveState().moveRound + 1}`
          : getPhaseString(this.phase()),
      ].join(" - ");
    });
  }

  inTheLead(game: LimitedGame): number[] {
    return this.process(game, () => {
      return this.playerHelper
        .getPlayersOrderedByScore()[0]
        .map(({ playerId }) => playerId);
    });
  }

  remainingPlayers(game: LimitedGame): number[] {
    return this.process(game, () => {
      return this.playerHelper
        .getRemainingPlayers()
        .map((player) => player.playerId);
    });
  }

  private process<T>(game: LimitedGame, processFn: () => T): T {
    try {
      this.gameMemory.setGame(game);
      if (game.gameData != null) {
        this.state.merge(game.gameData);
      }
      return processFn();
    } finally {
      this.memory.reset();
    }
  }

  private getGameState(): GameState {
    return {
      activePlayerId: this.gameEngine.hasEnded()
        ? undefined
        : this.currentPlayer().playerId,
      hasEnded: this.gameEngine.hasEnded(),
      gameData: this.state.serialize(),
      reversible: this.random.isReversible(),
      logs: this.log.dump(),
      autoActionMutations: this.autoActionManager.getMutations(),
      seed: this.random.getSeed(),
    };
  }
}
