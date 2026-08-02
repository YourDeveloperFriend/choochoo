import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { EngineDelegator, GameState } from "../../engine/framework/engine";
import { inject, injectState } from "../../engine/framework/execution_context";
import { LimitedGame } from "../../engine/game/game_memory";
import { PHASE } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { CURRENT_PLAYER, TURN_ORDER } from "../../engine/game/state";
import { ActionConstructor } from "../../engine/game/phase_module";
import { PlayerUser } from "../../engine/game/starter";
import { MapRegistry } from "../../maps/registry";
import { Coordinates } from "../../utils/coordinates";
import { InvalidInputError } from "../../utils/error";
import { Path } from "../../engine/move/move";
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { Phase, getPhaseString } from "../../engine/state/phase";
import { allLabels, coordinatesForLabel, labelForCoordinates } from "./labels";
import { ReadableGame, readGame } from "./read_game";
import { Referee } from "./referee";
import {
  GameSnapshot,
  PlayerSnapshot,
  SpaceSnapshot,
  playerIn,
  snapshotGame,
  spaceIn,
} from "./snapshot";

interface StartOptions {
  /**
   * The colors to deal, in playerId order: the first entry belongs to playerId 1.
   * Passing colors makes the mapping deterministic, so `as(RED)` is meaningful.
   * A number deals that many arbitrary colors instead. Defaults to the map's
   * minimum.
   */
  players?: PlayerColor[] | number;
  seed?: string;
  variant?: VariantConfig;
}

const DEFAULT_COLOR_ORDER: PlayerColor[] = [
  PlayerColor.RED,
  PlayerColor.BLUE,
  PlayerColor.YELLOW,
  PlayerColor.GREEN,
  PlayerColor.PURPLE,
  PlayerColor.BLACK,
  PlayerColor.BROWN,
  PlayerColor.PINK,
];

function toPlayerUsers(
  gameKey: GameKey,
  players: PlayerColor[] | number | undefined,
): PlayerUser[] {
  if (Array.isArray(players)) {
    const duplicates = players.filter((c, i) => players.indexOf(c) !== i);
    if (duplicates.length > 0) {
      throw new Error(
        `Cannot deal the same color twice: ${duplicates.map(playerColorToString).join(", ")}`,
      );
    }
    // GameStarter honours preferredColors when the color is still available, so
    // giving each player exactly one pins the playerId -> color mapping.
    return players.map((color, index) => ({
      playerId: index + 1,
      preferredColors: [color],
    }));
  }
  const count = players ?? MapRegistry.singleton.get(gameKey).minPlayers;
  return toPlayerUsers(gameKey, DEFAULT_COLOR_ORDER.slice(0, count));
}

/**
 * Drives a real game through the real engine, in process.
 *
 * Actions are emitted through the same ActionConstructor classes the client uses,
 * so a rename is a compile error rather than a silent string mismatch, and the
 * assertInput -> validate -> process path is identical to the one a browser click
 * takes. Action data is round-tripped through JSON first, exactly as the server
 * would receive it, so state that cannot survive serialization fails here.
 *
 * The referee checks engine invariants after every action, so a test written about
 * one map's rules also guards the core engine.
 */
export class TestGame {
  private state: GameState;
  private readonly referee: Referee;
  private readonly allLogs: string[];
  private logsFromLastAction: string[];
  private actionCount = 0;

  private constructor(
    readonly gameKey: GameKey,
    readonly variant: VariantConfig,
    initial: GameState,
  ) {
    this.state = initial;
    this.allLogs = [...initial.logs];
    this.logsFromLastAction = [...initial.logs];
    this.referee = new Referee(this.snapshot());
  }

  static start(gameKey: GameKey, options: StartOptions = {}): TestGame {
    const variant = options.variant ?? {};
    const state = EngineDelegator.singleton.start({
      game: { id: 1, gameKey, variant },
      players: toPlayerUsers(gameKey, options.players),
      seed: options.seed ?? `test-${gameKey}`,
    });
    return new TestGame(gameKey, variant, state);
  }

  private get readable(): ReadableGame {
    return {
      gameKey: this.gameKey,
      gameData: this.state.gameData,
      variant: this.variant,
    };
  }

  private get limited(): LimitedGame {
    return {
      id: 1,
      gameKey: this.gameKey,
      gameData: this.state.gameData,
      variant: this.variant,
    };
  }

  /** The serialized state, as the database would store it. */
  get gameData(): string {
    return this.state.gameData;
  }

  get hasEnded(): boolean {
    return this.state.hasEnded;
  }

  /** Every log line the game has emitted, oldest first. */
  get logs(): readonly string[] {
    return this.allLogs;
  }

  /** Only the log lines produced by the most recent action. */
  get lastLogs(): readonly string[] {
    return this.logsFromLastAction;
  }

  /** The phase/round line the UI shows, e.g. "Turn 1/8 - Build track". */
  get summary(): string {
    return EngineDelegator.singleton.readSummary(this.limited);
  }

  get round(): number {
    return this.snapshot().round!;
  }

  get phase(): Phase {
    return this.read(({ phase }) => phase);
  }

  get phaseName(): string {
    return getPhaseString(this.phase);
  }

  get currentPlayer(): PlayerColor {
    return this.read(({ currentPlayer }) => currentPlayer);
  }

  /** The colors dealt in this game, in turn order. */
  get turnOrder(): PlayerColor[] {
    return this.read(({ turnOrder }) => turnOrder);
  }

  private read<T>(fn: (state: EngineView) => T): T {
    return readGame(this.readable, () =>
      fn({
        phase: injectState(PHASE)(),
        currentPlayer: injectState(CURRENT_PLAYER)(),
        turnOrder: [...injectState(TURN_ORDER).getOr([])],
      }),
    );
  }

  snapshot(): GameSnapshot {
    return snapshotGame(this.readable);
  }

  player(color: PlayerColor): PlayerSnapshot {
    return playerIn(this.snapshot(), color);
  }

  /** The space at a displayed label, or undefined if it holds nothing of note. */
  space(label: string): SpaceSnapshot | undefined {
    return spaceIn(this.snapshot(), label.trim().toUpperCase());
  }

  /** Resolves a displayed label ("B5") to coordinates. */
  coord(label: string): Coordinates {
    return coordinatesForLabel(this.readable, label);
  }

  coords(...labels: string[]): Coordinates[] {
    return labels.map((label) => this.coord(label));
  }

  /** Every label on this map, for tests that need to search the board. */
  get labels(): string[] {
    return allLabels(this.readable);
  }

  /** The label the UI would show for these coordinates. */
  label(coordinates: Coordinates): string {
    return labelForCoordinates(this.readable, coordinates);
  }

  /** Builds a delivery path from a list of labels, for MoveAction. */
  path(...labels: string[]): Path[] {
    return labels.map((label) => ({ endingStop: this.coord(label) }));
  }

  /** Whether the given action could be emitted right now. */
  canEmit<T extends object>(action: ActionConstructor<T>): boolean {
    return readGame(this.readable, () => {
      const delegator = inject(PhaseDelegator);
      try {
        return delegator.get().canEmit(action);
      } catch {
        // No phase processor for the current phase (e.g. the game has ended).
        return false;
      }
    });
  }

  /**
   * The validation message the UI would show for this action data, or undefined if
   * it is valid. Mirrors the client's useAction().getErrorMessage.
   */
  errorFor<T extends object>(
    action: ActionConstructor<T>,
    data: T,
  ): string | undefined {
    return readGame(this.readable, () => {
      const processor = inject(action);
      try {
        processor.validate(processor.assertInput(roundTrip(data)));
        return undefined;
      } catch (e) {
        if (e instanceof InvalidInputError) return e.message;
        throw e;
      }
    });
  }

  /** Emits an action as the current player. */
  emit<T extends object>(action: ActionConstructor<T>, data: T): this {
    const actionName = action.action;
    const before = this.summary;

    this.state = EngineDelegator.singleton.processAction(this.gameKey, {
      game: this.limited,
      actionName,
      actionData: roundTrip(data),
      seed: this.state.seed ?? undefined,
    });

    this.actionCount++;
    this.logsFromLastAction = [...this.state.logs];
    this.allLogs.push(...this.state.logs);

    this.referee.check(
      this.snapshot(),
      `${actionName} #${this.actionCount} (during "${before}")`,
    );
    return this;
  }

  /**
   * Emits an action, asserting it is that player's turn first. Reads better than a
   * bare emit and turns a turn-order mistake into a clear failure rather than a
   * confusing rules error.
   */
  as(color: PlayerColor): {
    emit<T extends object>(action: ActionConstructor<T>, data: T): TestGame;
  } {
    const current = this.currentPlayer;
    if (current !== color) {
      throw new Error(
        `Expected it to be ${playerColorToString(color)}'s turn, but it is ` +
          `${playerColorToString(current)}'s (${this.summary}).`,
      );
    }
    return {
      emit: <T extends object>(action: ActionConstructor<T>, data: T) =>
        this.emit(action, data),
    };
  }
}

interface EngineView {
  phase: Phase;
  currentPlayer: PlayerColor;
  turnOrder: PlayerColor[];
}

/**
 * Puts action data through JSON exactly as the HTTP layer would, so a test cannot
 * pass something the real client could not send.
 */
function roundTrip<T>(data: T): unknown {
  return JSON.parse(JSON.stringify(data));
}

/** Starts a game driven through the real engine. */
export function startGame(gameKey: GameKey, options?: StartOptions): TestGame {
  return TestGame.start(gameKey, options);
}
