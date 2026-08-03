import { PlayerColor, playerColorToString } from "../../engine/state/player";

/**
 * Rewrites the player colours in a recorded game onto the colours a replay
 * deals.
 *
 * Setting up a game is reproducible from its seed, but which player ends up with
 * which colour is not: colour preferences are read from the users when the game
 * starts and are recorded nowhere. Players are otherwise interchangeable, so a
 * recording can simply be relabelled -- the recorded game and the replay are the
 * same game under a renaming.
 *
 * The mapping comes from turn order: the player who went first in the recording
 * becomes the player who goes first in the replay, and so on. That is what makes
 * the actions line up, since which player acts at each step follows from turn
 * order.
 *
 * Most action payloads carry no colour, and the few that do are listed below. A
 * colour that is missed is usually caught rather than silent: MoveValidator
 * checks a path's owners against who actually owns that track, so a wrongly
 * relabelled move fails to validate. The importer also replays the relabelled
 * actions and compares the outcome against the original, which catches the rest.
 */

export type PlayerColorRelabel = (color: PlayerColor) => PlayerColor;

/**
 * Fields in an action payload that hold a player colour.
 *
 * Deliberately a list of exact names rather than anything inferred. `color`
 * alone is not here: Good and PlayerColor overlap numerically, so rewriting
 * every field called `color` would corrupt a good's colour without any error.
 * Nested cases are handled by NESTED_PLAYER_PLAYER_COLOR_FIELDS.
 */
const PLAYER_COLOR_FIELDS = new Set([
  // engine/move/move.ts: Path.owner
  "owner",
  // maps/alabama_railways/move_good.ts: AlabamaMoveData.forgo
  "forgo",
  // maps/chesapeake-and-ohio/build.ts: factoryColor
  "factoryColor",
]);

/**
 * Fields holding an object with a `color` inside.
 *
 * maps/moon/low_gravitation.ts: MoonMoveData.stealFrom is `{ color? }`.
 */
const NESTED_PLAYER_PLAYER_COLOR_FIELDS = new Set(["stealFrom"]);

/** Extra player-colour rewriters for payloads the field lists cannot express. */
const customPlayerColorRelabellers = new Map<
  string,
  (data: unknown, relabel: PlayerColorRelabel) => unknown
>();

/**
 * Registers a player-colour rewriter for one action's payload.
 *
 * For a map whose action carries a player colour somewhere the declared field
 * names cannot reach. Prefer registerPlayerColorField when a plain field name
 * will do.
 */
export function registerActionPlayerColorRelabeller(
  actionName: string,
  relabeller: (data: unknown, relabel: PlayerColorRelabel) => unknown,
): void {
  customPlayerColorRelabellers.set(actionName, relabeller);
}

/**
 * Declares another action-payload field as holding a player colour.
 *
 * Only for player colours. A field holding a good's colour must not be listed:
 * the two are the same runtime type, and relabelling a good would corrupt it.
 */
export function registerPlayerColorField(field: string): void {
  PLAYER_COLOR_FIELDS.add(field);
}

/** Forgets every player-colour registration. For tests that add one. */
export function clearPlayerColorRelabels(): void {
  customPlayerColorRelabellers.clear();
}

/**
 * Builds the mapping from the recorded game's colours onto the replay's.
 *
 * Both turn orders are permutations of the colours dealt, so matching them by
 * position gives a bijection. Colours the recording never dealt map to
 * themselves, so a stray value passes through rather than being silently changed.
 */
export function buildPlayerColorRelabel(
  recordedTurnOrder: readonly PlayerColor[],
  replayedTurnOrder: readonly PlayerColor[],
): PlayerColorRelabel {
  if (recordedTurnOrder.length !== replayedTurnOrder.length) {
    throw new Error(
      `cannot relabel: the recording dealt ${recordedTurnOrder.length} ` +
        `players but the replay dealt ${replayedTurnOrder.length}`,
    );
  }

  const mapping = new Map<PlayerColor, PlayerColor>();
  for (const [index, recorded] of recordedTurnOrder.entries()) {
    mapping.set(recorded, replayedTurnOrder[index]);
  }

  return (color) => mapping.get(color) ?? color;
}

/** Describes a player-colour relabelling, for messages and transcripts. */
export function describePlayerColorRelabel(
  recordedTurnOrder: readonly PlayerColor[],
  replayedTurnOrder: readonly PlayerColor[],
): string {
  return recordedTurnOrder
    .map(
      (recorded, index) =>
        `${playerColorToString(recorded)}->${playerColorToString(replayedTurnOrder[index])}`,
    )
    .join(" ");
}

/** Rewrites every *player* colour in one action's payload, leaving goods alone. */
export function relabelPlayerColorsIn(
  actionName: string,
  data: unknown,
  relabel: PlayerColorRelabel,
): unknown {
  const custom = customPlayerColorRelabellers.get(actionName);
  if (custom != null) return custom(data, relabel);
  return rewrite(data, relabel);
}

function rewrite(value: unknown, relabel: PlayerColorRelabel): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => rewrite(entry, relabel));
  }
  if (value == null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (PLAYER_COLOR_FIELDS.has(key) && typeof entry === "number") {
      result[key] = relabel(entry as PlayerColor);
    } else if (NESTED_PLAYER_PLAYER_COLOR_FIELDS.has(key)) {
      result[key] = rewritePlayerColorHolder(entry, relabel);
    } else {
      result[key] = rewrite(entry, relabel);
    }
  }
  return result;
}

function rewritePlayerColorHolder(
  value: unknown,
  relabel: PlayerColorRelabel,
): unknown {
  if (value == null || typeof value !== "object") return value;
  const holder = value as Record<string, unknown>;
  if (typeof holder.color !== "number") return rewrite(value, relabel);
  return { ...holder, color: relabel(holder.color as PlayerColor) };
}
