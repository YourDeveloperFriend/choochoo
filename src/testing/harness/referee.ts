import { GameSnapshot, PlayerSnapshot } from "./snapshot";

/**
 * Engine-wide invariants, checked against a snapshot.
 *
 * The point of the referee is leverage: it runs after every action in every test,
 * so a test written to check one map's delivery rules also transitively guards the
 * core engine. Only genuinely universal properties belong here -- a check that
 * needs a per-map exception is a check that will be silenced everywhere.
 *
 * Deliberately NOT checked: cube conservation. Too many maps legitimately create
 * or destroy goods (production, deurbanization, Sicily's black cubes, Jamaica's
 * pure cubes, instant production drawing from the bag), so a global conservation
 * rule would be false-positive noise. It belongs in per-map tests that know which
 * transitions are legal.
 */

/** A single invariant violation. */
interface Violation {
  invariant: string;
  detail: string;
}

const KNOWN_COLORS = new Set([
  "red",
  "yellow",
  "green",
  "purple",
  "black",
  "blue",
  "brown",
  "white",
  "pink",
]);

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function checkPlayerNumbers(player: PlayerSnapshot): Violation[] {
  const violations: Violation[] = [];
  const numbers: Array<[string, number]> = [
    ["money", player.money],
    ["income", player.income],
    ["shares", player.shares],
    ["locomotive", player.locomotive],
    ["trackMarkers", player.trackMarkers],
  ];
  for (const [field, value] of numbers) {
    if (!isFiniteNumber(value)) {
      violations.push({
        invariant: "player numbers are finite",
        detail: `${player.color}.${field} = ${value}`,
      });
    }
  }

  // MoneyManager.addMoney floors money at 0, converting any shortfall into lost
  // income, and the only two overrides (Denmark, Detroit) change bankruptcy
  // rather than that flooring -- so this holds for every map. An out-of-game
  // player is parked at money 0, so the bound is stated for live players only.
  //
  // Note there is deliberately no matching income check: the same code path does
  // `income -= lostIncome` with no floor, and Denmark starts players at income
  // -4 outright, so negative income is legal.
  if (!player.outOfGame && player.money < 0) {
    violations.push({
      invariant: "in-game players never hold negative money",
      detail: `${player.color} has $${player.money}`,
    });
  }

  if (player.shares < 0) {
    violations.push({
      invariant: "shares are never negative",
      detail: `${player.color} has ${player.shares} shares`,
    });
  }
  if (player.locomotive < 0) {
    violations.push({
      invariant: "locomotive is never negative",
      detail: `${player.color} has locomotive ${player.locomotive}`,
    });
  }
  return violations;
}

/** Checks the invariants that hold for any single game state. */
export function checkSnapshot(snapshot: GameSnapshot): Violation[] {
  const violations: Violation[] = [];

  for (const player of snapshot.players) {
    violations.push(...checkPlayerNumbers(player));
    if (!KNOWN_COLORS.has(player.color)) {
      violations.push({
        invariant: "player colors are known",
        detail: `unrecognized color ${player.color}`,
      });
    }
  }

  const colors = snapshot.players.map((p) => p.color);
  if (new Set(colors).size !== colors.length) {
    violations.push({
      invariant: "player colors are unique",
      detail: `colors: ${colors.join(", ")}`,
    });
  }

  if (snapshot.round != null && snapshot.round < 1) {
    violations.push({
      invariant: "round is at least 1",
      detail: `round = ${snapshot.round}`,
    });
  }

  if (
    snapshot.currentPlayer != null &&
    !colors.includes(snapshot.currentPlayer)
  ) {
    violations.push({
      invariant: "current player is in the game",
      detail: `current = ${snapshot.currentPlayer}, players = ${colors.join(", ")}`,
    });
  }

  const seenInTurnOrder = new Set<string>();
  for (const color of snapshot.turnOrder) {
    if (seenInTurnOrder.has(color)) {
      violations.push({
        invariant: "turn order has no duplicates",
        detail: `${color} appears twice in ${snapshot.turnOrder.join(",")}`,
      });
    }
    seenInTurnOrder.add(color);
    if (!colors.includes(color)) {
      violations.push({
        invariant: "turn order only contains players in the game",
        detail: `${color} is in turn order but not a player`,
      });
    }
  }

  const labels = snapshot.spaces.map((s) => s.label);
  if (new Set(labels).size !== labels.length) {
    const duplicates = labels.filter((l, i) => labels.indexOf(l) !== i);
    violations.push({
      invariant: "space labels are unique",
      detail: `duplicated: ${[...new Set(duplicates)].join(", ")}`,
    });
  }

  // Deliberately checks that the owner is a *known colour*, not that it belongs
  // to a player in this game: Montreal Metro and Chicago L have the government
  // build track owned by GOVERNMENT_COLOR (PlayerColor.PURPLE), which is a real
  // colour but not a dealt player. An earlier draft asserted membership and
  // false-positived on both maps.
  for (const space of snapshot.spaces) {
    for (const segment of space.track ?? []) {
      const owner = segment.split(":")[0];
      if (
        owner !== "unowned" &&
        owner !== "claimable" &&
        !KNOWN_COLORS.has(owner)
      ) {
        violations.push({
          invariant: "track owners are known player colors",
          detail: `${space.label} has track owned by "${owner}"`,
        });
      }
    }
  }

  for (const [good, count] of Object.entries(snapshot.bag)) {
    if (!isFiniteNumber(count) || count < 0) {
      violations.push({
        invariant: "bag counts are non-negative integers",
        detail: `${good} = ${count}`,
      });
    }
  }

  return violations;
}

interface Baseline {
  colors: string[];
  playerCount: number;
}

/**
 * Checks invariants across a sequence of states from one game, catching drift
 * that a single snapshot can't reveal, such as players appearing or vanishing.
 *
 * Note what is deliberately not checked here: that the round counter only ever
 * climbs. Soul Train restarts numbering at 1 when Hell empties and Heaven opens,
 * so monotonic rounds is a property of most maps rather than of the engine. The
 * transcript records each round boundary anyway, so a round that moved when it
 * should not have still shows up there.
 */
export class Referee {
  private readonly baseline: Baseline;

  constructor(initial: GameSnapshot) {
    this.baseline = {
      colors: initial.players.map((p) => p.color),
      playerCount: initial.players.length,
    };
    this.check(initial, "initial state");
  }

  /** Throws if `snapshot` violates any invariant. `context` labels the failure. */
  check(snapshot: GameSnapshot, context: string): void {
    const violations = [
      ...checkSnapshot(snapshot),
      ...this.checkAgainstBaseline(snapshot),
    ];
    if (violations.length === 0) return;

    const detail = violations
      .map(({ invariant, detail }) => `  - ${invariant}: ${detail}`)
      .join("\n");
    throw new Error(`Engine invariant violated after ${context}:\n${detail}`);
  }

  private checkAgainstBaseline(snapshot: GameSnapshot): Violation[] {
    const violations: Violation[] = [];

    if (snapshot.players.length !== this.baseline.playerCount) {
      violations.push({
        invariant: "the set of players never changes size",
        detail: `started with ${this.baseline.playerCount}, now ${snapshot.players.length}`,
      });
    }

    const colors = snapshot.players.map((p) => p.color);
    const missing = this.baseline.colors.filter((c) => !colors.includes(c));
    const added = colors.filter((c) => !this.baseline.colors.includes(c));
    if (missing.length > 0 || added.length > 0) {
      violations.push({
        invariant: "player colors never change",
        detail: `missing: [${missing.join(", ")}], unexpected: [${added.join(", ")}]`,
      });
    }

    return violations;
  }
}
