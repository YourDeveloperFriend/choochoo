import { z } from "zod";

// The locomotive track has two rows. When a player advances they choose which
// row to occupy and gain only that row's benefit. Each box lists the engine
// level (the length of a delivery) and the multiplier (the number of
// deliveries the player may make during the move goods phase).
export enum LocoRow {
  MANY = "many",
  SINGLE = "single",
}

export const LocoRowZod = z.nativeEnum(LocoRow);

interface LocoBox {
  // The engine level, i.e. how many links a single delivery may cross.
  readonly engine: number;
  // The number of deliveries the player may make per move goods phase.
  readonly multiplier: number;
}

// Indexed by box (0-8).
const MANY_PLAYERS_ROW: readonly LocoBox[] = [
  { engine: 1, multiplier: 1 },
  { engine: 2, multiplier: 1 },
  { engine: 2, multiplier: 2 },
  { engine: 3, multiplier: 2 },
  { engine: 4, multiplier: 2 },
  { engine: 5, multiplier: 2 },
  { engine: 6, multiplier: 2 },
  { engine: 6, multiplier: 3 },
  { engine: 7, multiplier: 3 },
];

const SINGLE_PLAYER_ROW: readonly LocoBox[] = [
  { engine: 1, multiplier: 1 },
  { engine: 2, multiplier: 2 },
  { engine: 3, multiplier: 2 },
  { engine: 3, multiplier: 3 },
  { engine: 5, multiplier: 2 },
  { engine: 6, multiplier: 2 },
  { engine: 4, multiplier: 4 },
  { engine: 5, multiplier: 4 },
  { engine: 8, multiplier: 3 },
];

// Cost to advance into a given box. There is no cost to occupy the starting box
// (0), so LOCO_COSTS[box - 1] is the cost to advance into `box`.
const LOCO_COSTS: readonly number[] = [4, 5, 7, 10, 12, 15, 17, 20];

export const MAX_LOCO_BOX = MANY_PLAYERS_ROW.length - 1;

// Four delivery rounds during the move goods phase.
export const NUM_MOVE_ROUNDS = 4;

function rowData(row: LocoRow): readonly LocoBox[] {
  return row === LocoRow.SINGLE ? SINGLE_PLAYER_ROW : MANY_PLAYERS_ROW;
}

export function engineLevel(box: number, row: LocoRow): number {
  return rowData(row)[box].engine;
}

export function multiplier(box: number, row: LocoRow): number {
  return rowData(row)[box].multiplier;
}

export function costToAdvanceInto(box: number): number {
  return LOCO_COSTS[box - 1];
}

export function describeBox(box: number, row: LocoRow): string {
  const data = rowData(row)[box];
  return `${data.engine} (x${data.multiplier})`;
}
