import {
  activeTimeElapsed,
  activeTimeElapsedForGame,
  initialFlexTime,
  playerFlexRemaining,
  storedFlexTime,
} from "./active_time";

const H = 60 * 60 * 1000;

// All timestamps are UTC strings to keep tests timezone-independent.
function d(iso: string): Date {
  return new Date(iso);
}

describe("activeTimeElapsed", () => {
  describe("all-day window", () => {
    it("returns wall-clock elapsed when gameHoursDuration >= 24", () => {
      const start = d("2024-01-01T10:00:00Z");
      const now = d("2024-01-01T13:00:00Z");
      expect(activeTimeElapsed(start, now, 0, 24)).toBe(3 * H);
    });

    it("returns 0 when now equals start", () => {
      const start = d("2024-01-01T10:00:00Z");
      expect(activeTimeElapsed(start, start, 0, 24)).toBe(0);
    });

    it("returns 0 when now is before start", () => {
      const start = d("2024-01-01T10:00:00Z");
      const now = d("2024-01-01T09:00:00Z");
      expect(activeTimeElapsed(start, now, 0, 24)).toBe(0);
    });
  });

  describe("windowed window (9am–9pm UTC, start=9, duration=12)", () => {
    const START_HOUR = 9;
    const DURATION = 12;

    it("counts full elapsed time when turn falls entirely within a window", () => {
      const start = d("2024-01-01T10:00:00Z");
      const now = d("2024-01-01T12:00:00Z");
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(2 * H);
    });

    it("counts only in-window time when turn starts before the window", () => {
      const start = d("2024-01-01T08:00:00Z");
      const now = d("2024-01-01T10:00:00Z");
      // window opens at 9am; only 9am–10am counts = 1h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(1 * H);
    });

    it("counts only in-window time when turn ends after the window", () => {
      const start = d("2024-01-01T20:00:00Z");
      const now = d("2024-01-01T22:00:00Z");
      // window closes at 9pm; only 8pm–9pm counts = 1h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(1 * H);
    });

    it("returns 0 when turn falls entirely outside the window", () => {
      const start = d("2024-01-01T21:00:00Z");
      const now = d("2024-01-02T08:59:00Z");
      // no overlap with either 9am–9pm window
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(0);
    });

    it("accumulates active time across multiple days", () => {
      const start = d("2024-01-01T10:00:00Z");
      const now = d("2024-01-03T10:00:00Z"); // exactly 2 days later
      // day 1: 10am–9pm = 11h; day 2: 9am–9pm = 12h; day 3: 9am–10am = 1h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(24 * H);
    });

    it("counts a full window when turn spans exactly one window", () => {
      const start = d("2024-01-01T21:00:00Z"); // after window closes
      const now = d("2024-01-02T21:00:00Z"); // after next window closes
      // day 2 window 9am–9pm = 12h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(12 * H);
    });

    it("handles turn start at the exact window boundary", () => {
      const start = d("2024-01-01T09:00:00Z"); // window opens exactly now
      const now = d("2024-01-01T11:00:00Z");
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(2 * H);
    });

    it("handles turn end at the exact window boundary", () => {
      const start = d("2024-01-01T10:00:00Z");
      const now = d("2024-01-01T21:00:00Z"); // window closes exactly now
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(11 * H);
    });
  });

  describe("midnight-spanning window (10pm–6am UTC, start=22, duration=8)", () => {
    const START_HOUR = 22;
    const DURATION = 8;

    it("counts time correctly when turn spans midnight", () => {
      const start = d("2024-01-01T23:00:00Z");
      const now = d("2024-01-02T02:00:00Z");
      // window: 10pm–6am, turn 11pm–2am = 3h all in window
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(3 * H);
    });

    it("counts only in-window portion before midnight", () => {
      const start = d("2024-01-01T21:00:00Z"); // 1h before window
      const now = d("2024-01-01T23:00:00Z");
      // window opens at 10pm; 10pm–11pm = 1h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(1 * H);
    });

    it("counts only in-window portion after midnight", () => {
      const start = d("2024-01-02T04:00:00Z");
      const now = d("2024-01-02T07:00:00Z"); // 1h after window closes at 6am
      // 4am–6am = 2h
      expect(activeTimeElapsed(start, now, START_HOUR, DURATION)).toBe(2 * H);
    });
  });
});

describe("activeTimeElapsedForGame", () => {
  it("returns 0 when turnStartTime is null", () => {
    const game = {
      turnStartTime: null,
      gameHoursStart: 9,
      gameHoursDuration: 12,
      turnDuration: H,
    };
    expect(activeTimeElapsedForGame(game, d("2024-01-01T10:00:00Z"))).toBe(0);
  });

  it("returns 0 when turnStartTime is undefined", () => {
    const game = {
      turnStartTime: undefined,
      gameHoursStart: 9,
      gameHoursDuration: 12,
      turnDuration: H,
    };
    expect(activeTimeElapsedForGame(game, d("2024-01-01T10:00:00Z"))).toBe(0);
  });

  it("accepts a Date turnStartTime and delegates correctly", () => {
    const game = {
      turnStartTime: d("2024-01-01T10:00:00Z"),
      gameHoursStart: 9,
      gameHoursDuration: 12,
      turnDuration: H,
    };
    expect(activeTimeElapsedForGame(game, d("2024-01-01T12:00:00Z"))).toBe(
      2 * H,
    );
  });

  it("accepts an ISO string turnStartTime", () => {
    const game = {
      turnStartTime: "2024-01-01T10:00:00Z",
      gameHoursStart: 9,
      gameHoursDuration: 12,
      turnDuration: H,
    };
    expect(activeTimeElapsedForGame(game, d("2024-01-01T12:00:00Z"))).toBe(
      2 * H,
    );
  });
});

describe("storedFlexTime", () => {
  const turnDuration = 2 * H;

  it("returns initialFlexTime when playerFlexTime is null", () => {
    const game = { playerFlexTime: null, turnDuration };
    expect(storedFlexTime(game, 1)).toBe(initialFlexTime(turnDuration));
  });

  it("returns initialFlexTime when player has no entry", () => {
    const game = { playerFlexTime: { "2": 5 * H }, turnDuration };
    expect(storedFlexTime(game, 1)).toBe(initialFlexTime(turnDuration));
  });

  it("returns stored value when player has an entry", () => {
    const game = { playerFlexTime: { "1": 1 * H }, turnDuration };
    expect(storedFlexTime(game, 1)).toBe(1 * H);
  });

  it("returns stored value of 0 (not falling back to initial)", () => {
    const game = { playerFlexTime: { "1": 0 }, turnDuration };
    expect(storedFlexTime(game, 1)).toBe(0);
  });
});

describe("playerFlexRemaining", () => {
  const turnDuration = 2 * H;
  const startTime = "2024-01-01T10:00:00Z";

  it("returns stored flex for a non-active player regardless of elapsed time", () => {
    const game = {
      turnStartTime: startTime,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: { "1": 1 * H },
      activePlayerId: 2,
    };
    // player 1 is not active — stored value returned as-is
    expect(playerFlexRemaining(game, 1, d("2024-01-01T15:00:00Z"))).toBe(1 * H);
  });

  it("returns full stored flex for active player when still within turn time", () => {
    const game = {
      turnStartTime: startTime,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: { "1": 5 * H },
      activePlayerId: 1,
    };
    // elapsed = 1h, turnDuration = 2h → no overrun
    expect(playerFlexRemaining(game, 1, d("2024-01-01T11:00:00Z"))).toBe(5 * H);
  });

  it("reduces flex for active player when turn time is exceeded", () => {
    const game = {
      turnStartTime: startTime,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: { "1": 5 * H },
      activePlayerId: 1,
    };
    // elapsed = 3h, turnDuration = 2h → overTime = 1h → 5h - 1h = 4h
    expect(playerFlexRemaining(game, 1, d("2024-01-01T13:00:00Z"))).toBe(4 * H);
  });

  it("returns 0 when overrun exceeds stored flex", () => {
    const game = {
      turnStartTime: startTime,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: { "1": 1 * H },
      activePlayerId: 1,
    };
    // elapsed = 5h, overTime = 3h > stored 1h → clamps to 0
    expect(playerFlexRemaining(game, 1, d("2024-01-01T15:00:00Z"))).toBe(0);
  });

  it("uses initialFlexTime as fallback when playerFlexTime is null", () => {
    const game = {
      turnStartTime: startTime,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: null,
      activePlayerId: 1,
    };
    // elapsed = 1h < turnDuration = 2h → no overrun, full initial pool
    expect(playerFlexRemaining(game, 1, d("2024-01-01T11:00:00Z"))).toBe(
      initialFlexTime(turnDuration),
    );
  });

  it("returns initialFlexTime when turnStartTime is null (no turn in progress)", () => {
    const game = {
      turnStartTime: null,
      gameHoursStart: 0,
      gameHoursDuration: 24,
      turnDuration,
      playerFlexTime: null,
      activePlayerId: 1,
    };
    expect(playerFlexRemaining(game, 1, d("2024-01-01T15:00:00Z"))).toBe(
      initialFlexTime(turnDuration),
    );
  });
});
