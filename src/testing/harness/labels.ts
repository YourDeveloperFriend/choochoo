import { GameKey } from "../../api/game_key";
import { injectGrid } from "../../engine/game/state";
import { Coordinates } from "../../utils/coordinates";
import { ReadableGame, readGame } from "./read_game";

/**
 * Maps the double-height labels the UI displays ("B5") to coordinates.
 *
 * The label for a coordinate depends on the map's rotation and on the grid's
 * bounding box (see Grid.toDoubleHeightDisplay), so rather than re-deriving that
 * arithmetic -- and risking disagreeing with what a player sees -- this builds a
 * reverse index from the grid itself. The grid's key set is fixed for the life of
 * a game (urbanizing replaces a Land with a City at the same coordinate), so the
 * index is cached per map.
 */
const indexes = new Map<GameKey, Map<string, Coordinates>>();

function buildIndex(game: ReadableGame): Map<string, Coordinates> {
  return readGame(game, () => {
    const grid = injectGrid()();
    const index = new Map<string, Coordinates>();
    for (const coordinates of grid.keys()) {
      index.set(
        grid.toDoubleHeightDisplay(coordinates).toString(),
        coordinates,
      );
    }
    return index;
  });
}

function getIndex(game: ReadableGame): Map<string, Coordinates> {
  const existing = indexes.get(game.gameKey);
  if (existing != null) return existing;
  const index = buildIndex(game);
  indexes.set(game.gameKey, index);
  return index;
}

/** Labels that look plausibly like the one asked for, to make errors actionable. */
function suggestions(index: Map<string, Coordinates>, label: string): string[] {
  const row = label.match(/^-?[A-Za-z]+/)?.[0].toUpperCase();
  if (row == null) return [];
  return [...index.keys()]
    .filter((candidate) => candidate.startsWith(row))
    .sort((a, b) => Number(a.slice(row.length)) - Number(b.slice(row.length)));
}

/**
 * Resolves a displayed label to coordinates, or throws listing what is available
 * in that row.
 */
export function coordinatesForLabel(
  game: ReadableGame,
  label: string,
): Coordinates {
  const index = getIndex(game);
  const normalized = label.trim().toUpperCase();
  const found = index.get(normalized);
  if (found != null) return found;

  const nearby = suggestions(index, normalized);
  const hint =
    nearby.length > 0
      ? ` Spaces in that row: ${nearby.join(", ")}.`
      : ` No spaces found in that row.`;
  throw new Error(`No space labelled "${label}" on ${game.gameKey}.${hint}`);
}

/** Renders coordinates as the label the UI would display. */
export function labelForCoordinates(
  game: ReadableGame,
  coordinates: Coordinates,
): string {
  for (const [label, candidate] of getIndex(game)) {
    if (candidate === coordinates) return label;
  }
  throw new Error(
    `Coordinates ${coordinates.toString()} are not on the ${game.gameKey} grid.`,
  );
}

/** Every label on the map, ordered by row then column. */
export function allLabels(game: ReadableGame): string[] {
  return [...getIndex(game).keys()];
}
