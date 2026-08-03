import { injectState } from "../../engine/framework/execution_context";
import { PHASE } from "../../engine/game/phase";
import { PlayerHelper } from "../../engine/game/player";
import { ROUND } from "../../engine/game/round";
import {
  BAG,
  CURRENT_PLAYER,
  TURN_ORDER,
  injectAllPlayersUnsafe,
  injectGrid,
} from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { TOWN, Track } from "../../engine/map/track";
import { Action } from "../../engine/state/action";
import { Good, goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import {
  PlayerColor,
  PlayerData,
  playerColorToString,
} from "../../engine/state/player";
import { Direction } from "../../engine/state/tile";
import { inject } from "../../engine/framework/execution_context";
import { ReadableGame, readGame } from "./read_game";

/**
 * A deterministic, human-readable view of a game state.
 *
 * This is deliberately an *allowlist* of game-meaningful facts rather than a dump
 * of the serialized state. Two consequences, both intentional:
 *
 *   - Adding a field to player/space state does not churn any snapshot.
 *   - Insertion order in the underlying state (notably grid ordering, which is
 *     not stable across writes) cannot affect the output.
 *
 * If a map needs to assert on state this doesn't cover, read it directly rather
 * than widening the projection for everyone.
 */
export interface GameSnapshot {
  round: number | undefined;
  phase: string | undefined;
  currentPlayer: string | undefined;
  turnOrder: string[];
  players: PlayerSnapshot[];
  /** Sorted by display label. Only spaces with something worth reporting. */
  spaces: SpaceSnapshot[];
  /** Good name -> count remaining in the bag. */
  bag: Record<string, number>;
}

export interface PlayerSnapshot {
  color: string;
  money: number;
  income: number;
  shares: number;
  locomotive: number;
  selectedAction: string | undefined;
  outOfGame: boolean;
  score: string;
  /** Count of ownership markers on the board, per the engine's own accounting. */
  trackMarkers: number;
}

export interface SpaceSnapshot {
  /** The double-height label the UI displays, e.g. "B5". */
  label: string;
  kind: "city" | "town" | "land";
  name: string | undefined;
  urbanized?: boolean;
  /** Goods sitting on the space, sorted by color name. */
  goods?: string[];
  /** Goods awaiting growth, per on-roll slot, in slot order. */
  onRoll?: string[];
  /** One entry per track segment, sorted for stability. */
  track?: string[];
}

const DIRECTION_NAMES: Record<Direction, string> = {
  [Direction.TOP]: "N",
  [Direction.TOP_RIGHT]: "NE",
  [Direction.BOTTOM_RIGHT]: "SE",
  [Direction.BOTTOM]: "S",
  [Direction.BOTTOM_LEFT]: "SW",
  [Direction.TOP_LEFT]: "NW",
};

function exitName(exit: number): string {
  return exit === TOWN ? "town" : DIRECTION_NAMES[exit as Direction];
}

/** A track segment rendered as "owner:exit-exit", with exits sorted. */
function describeTrack(track: Track): string {
  const owner = track.getOwner();
  const ownerName =
    owner != null
      ? playerColorToString(owner)
      : track.isClaimable()
        ? "claimable"
        : "unowned";
  const exits = track.getExits().map(exitName).sort().join("-");
  return `${ownerName}:${exits}`;
}

function sortedGoodNames(goods: readonly Good[]): string[] {
  return goods.map(goodToString).sort();
}

function actionName(action: Action | undefined): string | undefined {
  return action == null ? undefined : Action[action];
}

function describeSpace(grid: Grid, space: City | Land): SpaceSnapshot {
  const label = grid.toDoubleHeightDisplay(space.coordinates).toString();

  if (space instanceof City) {
    return {
      label,
      kind: "city",
      name: space.name(),
      urbanized: space.isUrbanized(),
      goods: sortedGoodNames(space.getGoods()),
      // On-roll slots are positional, so they are NOT sorted; a good moving
      // between slots is a real difference.
      onRoll: space
        .onRoll()
        .flatMap((onRoll) =>
          onRoll.goods.map((good) =>
            good == null ? "-" : goodToString(good as Good),
          ),
        ),
    };
  }

  const track = space.getTrack().map(describeTrack).sort();
  return {
    label,
    kind: space.hasTown() ? "town" : "land",
    name: space.name(),
    ...(space.getGoods().length > 0
      ? { goods: sortedGoodNames(space.getGoods()) }
      : {}),
    ...(track.length > 0 ? { track } : {}),
  };
}

/** True if a space carries any state worth reporting. */
function isInteresting(space: SpaceSnapshot): boolean {
  if (space.kind === "city") return true;
  return space.track != null || space.goods != null || space.kind === "town";
}

function labelSortKey(label: string): [string, number] {
  const match = label.match(/^(-?[A-Z]+)(-?\d+)$/);
  if (match == null) return [label, 0];
  return [match[1], Number(match[2])];
}

function compareLabels(a: string, b: string): number {
  const [rowA, colA] = labelSortKey(a);
  const [rowB, colB] = labelSortKey(b);
  if (rowA !== rowB) return rowA < rowB ? -1 : 1;
  return colA - colB;
}

/** Builds a canonical snapshot of the given serialized game state. */
export function snapshotGame(game: ReadableGame): GameSnapshot {
  return readGame(game, () => {
    const phase = injectState(PHASE);
    const round = injectState(ROUND);
    const currentPlayer = injectState(CURRENT_PLAYER);
    const turnOrder = injectState(TURN_ORDER);
    const bag = injectState(BAG);
    const players = injectAllPlayersUnsafe();
    const grid = injectGrid()();
    const playerHelper = inject(PlayerHelper);

    const spaces = [...grid.values()]
      .map((space) => describeSpace(grid, space))
      .filter(isInteresting)
      .sort((a, b) => compareLabels(a.label, b.label));

    const bagCounts: Record<string, number> = {};
    for (const good of bag.getOr([])) {
      const name = goodToString(good);
      bagCounts[name] = (bagCounts[name] ?? 0) + 1;
    }

    return {
      round: round.isInitialized() ? round() : undefined,
      phase: phase.isInitialized() ? phaseName(phase()) : undefined,
      currentPlayer: currentPlayer.isInitialized()
        ? playerColorToString(currentPlayer())
        : undefined,
      turnOrder: turnOrder.getOr([]).map((c) => playerColorToString(c)),
      // Sorted by colour, not by the engine's internal player array order, so
      // that changing how players are assigned doesn't churn every snapshot.
      // `turnOrder` still carries the ordering that matters to gameplay.
      players: players()
        .map((player) => ({
          color: playerColorToString(player.color),
          money: player.money,
          income: player.income,
          shares: player.shares,
          locomotive: player.locomotive,
          selectedAction: actionName(player.selectedAction),
          outOfGame: player.outOfGame ?? false,
          score: describeScore(playerHelper, player),
          trackMarkers: grid.countOwnershipMarkers(player.color),
        }))
        .sort((a, b) => (a.color < b.color ? -1 : 1)),
      spaces,
      bag: sortRecord(bagCounts),
    };
  });
}

function phaseName(phase: Phase): string {
  return Phase[phase];
}

function describeScore(playerHelper: PlayerHelper, player: PlayerData): string {
  const score = playerHelper.getScore(player);
  // Score is `number[] | "Eliminated"` -- the eliminated case is a string, not
  // an object, so it has to be tested for directly.
  return Array.isArray(score) ? score.join("/") : String(score);
}

function sortRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
}

/** Convenience for asserting on a single player without indexing. */
export function playerIn(
  snapshot: GameSnapshot,
  color: PlayerColor,
): PlayerSnapshot {
  const name = playerColorToString(color);
  const player = snapshot.players.find((p) => p.color === name);
  if (player == null) {
    throw new Error(
      `no ${name} player in snapshot; have ${snapshot.players.map((p) => p.color).join(", ")}`,
    );
  }
  return player;
}

/** Convenience for asserting on a single space by its displayed label. */
export function spaceIn(
  snapshot: GameSnapshot,
  label: string,
): SpaceSnapshot | undefined {
  return snapshot.spaces.find((space) => space.label === label);
}
