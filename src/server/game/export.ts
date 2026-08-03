import { GameExportApi } from "../../api/export";
import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";

/** The parts of a game the export needs. */
export interface ExportableGame {
  id: number;
  gameKey: GameKey;
  variant: VariantConfig;
  playerIds: number[];
}

/** The parts of a history row the export needs. */
export interface ExportableHistory {
  previousGameVersion: number;
  previousGameData: string | null;
  actionName: string | null;
  actionData: string | null;
  seed: string | null;
}

/**
 * Reduces a game and its history to a replayable form.
 *
 * Separated from the route so it can be tested without a database.
 */
export function toGameExport(
  game: ExportableGame,
  histories: ExportableHistory[],
): GameExportApi {
  const ordered = [...histories].sort(
    (a, b) => a.previousGameVersion - b.previousGameVersion,
  );

  // Starting a game writes a history row of its own: it carries the seed but no
  // action. Rows with an action are the ones that were applied.
  const start = ordered.find((history) => history.actionName == null);
  const applied = ordered.filter((history) => history.actionName != null);

  return {
    id: game.id,
    gameKey: game.gameKey,
    variant: game.variant,
    playerIds: game.playerIds,
    startSeed: start?.seed ?? null,
    // The state each action was applied to, so the first action's is the state
    // immediately after setup.
    startState: applied[0]?.previousGameData ?? null,
    actions: applied.map((history) => ({
      version: history.previousGameVersion,
      actionName: history.actionName!,
      actionData:
        history.actionData == null ? undefined : JSON.parse(history.actionData),
      seed: history.seed ?? null,
    })),
  };
}
