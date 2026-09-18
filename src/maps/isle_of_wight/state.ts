import { z } from "zod";
import { Key, MapKey } from "../../engine/framework/key";
import { PlayerColorZod } from "../../engine/state/player";
import { TrainCard } from "./train_data";

/**
 * How many cards of each tier are left in the deck, keyed by tier. A tier is
 * removed once it runs out, which is what makes the next tier the lowest
 * available layer.
 */
export const TRAIN_DECK = new MapKey(
  "IowTrainDeck",
  z.number().parse,
  z.number().parse,
);

/** The train cards in front of each player. */
export const PLAYER_TRAINS = new MapKey(
  "IowPlayerTrains",
  PlayerColorZod.parse,
  TrainCard.array().parse,
);

/** Unused Haggle coupons held by each player. */
export const HAGGLE_COUPONS = new MapKey(
  "IowHaggleCoupons",
  PlayerColorZod.parse,
  z.number().parse,
);

/** The highest tier of train bought so far, which drives the tile unlocks. */
export const HIGHEST_TIER_BOUGHT = new Key("IowHighestTierBought", {
  parse: z.number().parse,
});
