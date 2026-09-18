import { z } from "zod";
import { GoodZod } from "../../engine/state/good";

/**
 * The train cards, organised in tiers. A tier's `boxes` are the cube-sized
 * spaces printed on the card, read left to right: the number in a box is the
 * range of a delivery made with that train, and a delivered cube fills the
 * next open box, so range decreases as the train is used.
 */
interface TrainTier {
  // The tier, which doubles as the name of the train ("a 3-train").
  readonly tier: number;
  readonly cost: number;
  readonly boxes: readonly number[];
  // The number of copies in the deck. Starter trains scale with player count.
  readonly count: (playerCount: number) => number;
}

export const TRAIN_TIERS: readonly TrainTier[] = [
  { tier: 1, cost: 2, boxes: [1], count: (players) => players * 2 - 1 },
  { tier: 2, cost: 5, boxes: [2, 1], count: () => 7 },
  { tier: 3, cost: 6, boxes: [3, 2, 1], count: () => 6 },
  { tier: 4, cost: 7, boxes: [4, 3, 2], count: () => 5 },
  { tier: 5, cost: 8, boxes: [5, 4, 3], count: () => 5 },
  { tier: 6, cost: 9, boxes: [6, 6, 5, 5], count: () => 4 },
  { tier: 7, cost: 10, boxes: [7, 7, 6, 6], count: () => 10 },
];

export const TRAIN_TIER_NOTES: readonly (string | undefined)[] = [
  undefined,
  undefined,
  "Three-leg towns available",
  undefined,
  "Complex tiles available, max builds increased to 3",
];

/** The tier that unlocks the dedicated three-exit town tiles when first bought. */
export const TOWN_TILE_UNLOCK_TIER = 3;

/**
 * The tier that unlocks the complex track tiles, and a third tile lay per turn,
 * when first bought.
 */
export const COMPLEX_TILE_UNLOCK_TIER = 5;

/** The most trains a player may hold at once. */
export const MAX_TRAINS_PER_PLAYER = 2;

export const MAX_BUILDS_UNLOCK_TIER = 5;
export const BUILDS_BEFORE_UNLOCK = 2;
export const BUILDS_AFTER_UNLOCK = 3;

export function tierData(tier: number): TrainTier {
  const data = TRAIN_TIERS.find((data) => data.tier === tier);
  if (data == null) {
    throw new Error(`no train tier ${tier}`);
  }
  return data;
}

/** A train card in front of a player. */
export const TrainCard = z.object({
  tier: z.number(),
  // The goods delivered with this train, filling its boxes left to right.
  goods: z.array(GoodZod),
  // Whether the crew is on a donut and coffee break, i.e. used this turn.
  used: z.boolean(),
});
export type TrainCard = z.infer<typeof TrainCard>;

export function newTrainCard(tier: number): TrainCard {
  return { tier, goods: [], used: false };
}

/** The boxes on a card, paired with the good filling each, if any. */
export function cardBoxes(
  card: TrainCard,
): Array<{ range: number; good?: (typeof card.goods)[number] }> {
  return tierData(card.tier).boxes.map((range, index) => ({
    range,
    good: card.goods[index],
  }));
}

/**
 * The range of the next delivery made with this card, or undefined when every
 * box is full. A full card can still be exhausted to work in the factories.
 */
export function nextRange(card: TrainCard): number | undefined {
  return tierData(card.tier).boxes[card.goods.length];
}

export function describeTrain(card: TrainCard): string {
  const range = nextRange(card);
  return `${card.tier}-train (${range == null ? "full" : `range ${range}`})`;
}
