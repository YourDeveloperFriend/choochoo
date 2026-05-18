const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const FLEX_TIME_MULTIPLIER = 3;

export function initialFlexTime(turnDuration: number): number {
  return FLEX_TIME_MULTIPLIER * turnDuration;
}

interface GameTimerShape {
  turnStartTime?: Date | string | null;
  gameHoursStart: number;
  gameHoursDuration: number;
  turnDuration: number;
  playerFlexTime?: { [key: string]: number } | { [key: number]: number } | null;
  activePlayerId?: number | null;
}

/**
 * Returns the number of milliseconds of "active time" elapsed between
 * turnStartTime and now, counting only hours that fall within the repeating
 * daily game-hours window defined by gameHoursStart (UTC hour) and
 * gameHoursDuration (hours, 1-24).
 */
export function activeTimeElapsed(
  turnStartTime: Date,
  now: Date,
  gameHoursStart: number,
  gameHoursDuration: number,
): number {
  const startUTC = turnStartTime.getTime();
  const nowUTC = now.getTime();

  if (nowUTC <= startUTC) return 0;
  if (gameHoursDuration >= 24) return nowUTC - startUTC;

  const startMs = gameHoursStart * HOUR_MS;
  const durationMs = gameHoursDuration * HOUR_MS;
  const firstDay = Math.floor((startUTC - startMs) / DAY_MS);

  let total = 0;
  for (let d = firstDay; ; d++) {
    const windowStart = d * DAY_MS + startMs;
    const windowEnd = windowStart + durationMs;

    if (windowStart >= nowUTC) break;

    const overlapStart = Math.max(startUTC, windowStart);
    const overlapEnd = Math.min(nowUTC, windowEnd);

    if (overlapEnd > overlapStart) {
      total += overlapEnd - overlapStart;
    }
  }

  return total;
}

/** Active milliseconds elapsed since the current turn started, or 0 if no turn is in progress. */
export function activeTimeElapsedForGame(
  game: GameTimerShape,
  now: Date = new Date(),
): number {
  if (game.turnStartTime == null) return 0;
  return activeTimeElapsed(
    new Date(game.turnStartTime),
    now,
    game.gameHoursStart,
    game.gameHoursDuration,
  );
}

/** Stored flex time for a player, falling back to the full initial pool if not yet set. */
export function storedFlexTime(
  game: Pick<GameTimerShape, "playerFlexTime" | "turnDuration">,
  playerId: number,
): number {
  return (
    (game.playerFlexTime as Record<string, number>)?.[String(playerId)] ??
    initialFlexTime(game.turnDuration)
  );
}

/**
 * Effective flex time remaining for a player. For the active player this
 * accounts for overrun already accumulated in the current turn; for all
 * other players it returns their stored pool.
 */
export function playerFlexRemaining(
  game: GameTimerShape,
  playerId: number,
  now: Date = new Date(),
): number {
  const stored = storedFlexTime(game, playerId);
  if (playerId !== game.activePlayerId) return stored;
  const overTime = Math.max(
    0,
    activeTimeElapsedForGame(game, now) - game.turnDuration,
  );
  return Math.max(0, stored - overTime);
}
