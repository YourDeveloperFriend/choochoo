import { inject, injectState } from "../../engine/framework/execution_context";
import { Log } from "../../engine/game/log";
import { MoneyManager } from "../../engine/game/money_manager";
import { BAG } from "../../engine/game/state";
import { Good } from "../../engine/state/good";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import {
  HAGGLE_COUPONS,
  HIGHEST_TIER_BOUGHT,
  PLAYER_TRAINS,
  TRAIN_DECK,
} from "./state";
import {
  BUILDS_AFTER_UNLOCK,
  BUILDS_BEFORE_UNLOCK,
  COMPLEX_TILE_UNLOCK_TIER,
  MAX_BUILDS_UNLOCK_TIER,
  MAX_TRAINS_PER_PLAYER,
  newTrainCard,
  nextRange,
  tierData,
  TOWN_TILE_UNLOCK_TIER,
  TRAIN_TIERS,
  TrainCard,
} from "./train_data";
import {
  ComplexTileType,
  TileType,
  TownTileType,
} from "../../engine/state/tile";
import { ImmutableMap } from "../../utils/immutable";

interface HeldTrain {
  index: number;
  card: TrainCard;
}

export class TrainHelper {
  private readonly deck = injectState(TRAIN_DECK);
  private readonly playerTrains = injectState(PLAYER_TRAINS);
  private readonly coupons = injectState(HAGGLE_COUPONS);
  private readonly highestTierBought = injectState(HIGHEST_TIER_BOUGHT);
  private readonly moneyManager = inject(MoneyManager);
  private readonly bag = injectState(BAG);
  private readonly log = inject(Log);

  remaining(tier: number): number {
    return this.deck().get(tier) ?? 0;
  }

  /**
   * The only tier players may buy from: the lowest layer with cards left.
   * Undefined once the deck is empty. `taken` discounts copies already
   * claimed earlier in the same all-at-once purchase.
   */
  lowestAvailableTier(): number | undefined {
    return TRAIN_TIERS.map(({ tier }) => tier).find(
      (tier) => this.remaining(tier) > 0,
    );
  }

  trainsFor(color: PlayerColor): readonly TrainCard[] {
    return this.playerTrains().get(color) ?? [];
  }

  unusedTrains(color: PlayerColor): HeldTrain[] {
    return this.trainsFor(color)
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !card.used);
  }

  /** Unused trains that still have an open box, i.e. can carry a delivery. */
  deliverableTrains(color: PlayerColor): HeldTrain[] {
    return this.unusedTrains(color).filter(
      ({ card }) => nextRange(card) != null,
    );
  }

  /** The longest delivery the player could still make this turn. */
  maxRange(color: PlayerColor): number {
    const ranges = this.deliverableTrains(color).map(
      ({ card }) => nextRange(card)!,
    );
    return ranges.length === 0 ? 0 : Math.max(...ranges);
  }

  couponsFor(color: PlayerColor): number {
    return this.coupons().get(color) ?? 0;
  }

  trainSlotsRemaining(color: PlayerColor): number {
    return MAX_TRAINS_PER_PLAYER - this.trainsFor(color).length;
  }

  adjustTileManifest(
    manifest: ImmutableMap<TileType, number>,
  ): ImmutableMap<TileType, number> {
    if (this.highestTierBought() < TOWN_TILE_UNLOCK_TIER) {
      manifest = manifest.deleteAll([
        TownTileType.TIGHT_THREE,
        TownTileType.LEFT_LEANER,
        TownTileType.RIGHT_LEANER,
        TownTileType.THREE_WAY,
      ]);
    }
    if (this.highestTierBought() < COMPLEX_TILE_UNLOCK_TIER) {
      manifest = manifest.deleteAll([
        ComplexTileType.X,
        ComplexTileType.BOW_AND_ARROW,
        ComplexTileType.CROSSING_CURVES,
        ComplexTileType.STRAIGHT_TIGHT,
        ComplexTileType.COEXISTING_CURVES,
        ComplexTileType.CURVE_TIGHT_1,
        ComplexTileType.CURVE_TIGHT_2,
      ]);
    }
    return manifest;
  }

  getMaxBuilds(): number {
    return this.highestTierBought() >= MAX_BUILDS_UNLOCK_TIER
      ? BUILDS_AFTER_UNLOCK
      : BUILDS_BEFORE_UNLOCK;
  }

  /** The cost of the next purchase for this player, given coupons spent. */
  costOf(tier: number, couponsUsed: number): number {
    const base = tierData(tier).cost;
    if (couponsUsed >= 2) return 0;
    if (couponsUsed === 1) return base - Math.floor(base / 2);
    return base;
  }

  buy(color: PlayerColor, tier: number, couponsUsed: number): void {
    assert(this.remaining(tier) > 0, `no ${tier}-trains left`);
    const cost = this.costOf(tier, couponsUsed);

    this.deck.update((deck) => {
      deck.set(tier, deck.get(tier)! - 1);
    });
    this.playerTrains.update((trains) => {
      trains.set(color, [...(trains.get(color) ?? []), newTrainCard(tier)]);
    });
    if (couponsUsed > 0) {
      this.coupons.update((coupons) => {
        coupons.set(color, (coupons.get(color) ?? 0) - couponsUsed);
      });
    }
    this.moneyManager.addMoney(color, -cost);

    if (tier > this.highestTierBought()) {
      this.highestTierBought.set(tier);
      if (tier >= COMPLEX_TILE_UNLOCK_TIER) {
        this.log.log(
          "The first 5-train has been sold: the complex track tiles are now available, and players may build 3 tiles each turn.",
        );
      } else if (tier >= TOWN_TILE_UNLOCK_TIER) {
        this.log.log(
          "The first 3-train has been sold: the dedicated three-exit town tiles are now available.",
        );
      }
    }
  }

  grantCoupon(color: PlayerColor): void {
    this.coupons.update((coupons) => {
      coupons.set(color, (coupons.get(color) ?? 0) + 1);
    });
  }

  /** Exhausts a train and, if it has an open box, loads the good into it. */
  useTrain(color: PlayerColor, index: number, good?: Good): void {
    this.playerTrains.update((trains) => {
      const cards = trains.get(color)!;
      const card = cards[index];
      assert(card != null, `no train at index ${index}`);
      assert(!card.used, "train already used this turn");
      cards[index] = {
        ...card,
        used: true,
        goods: good == null ? card.goods : [...card.goods, good],
      };
      trains.set(color, cards);
    });
  }

  /** Returns every train's crew from their break, at the start of a turn. */
  resetUsed(): void {
    this.playerTrains.update((trains) => {
      for (const [color, cards] of trains) {
        trains.set(
          color,
          cards.map((card) => (card.used ? { ...card, used: false } : card)),
        );
      }
    });
  }

  /** Removes goods from a card by box index, returning them to the bag. */
  removeGood(color: PlayerColor, index: number): void {
    this.playerTrains.update((trains) => {
      const cards = trains.get(color)!;
      const card = cards[index];
      assert(card != null, `no train at index ${index}`);
      assert(card.goods.length > 0, `no goods on train at index ${index}`);
      const removed = card.goods[card.goods.length - 1];
      card.goods = card.goods.slice(0, card.goods.length - 1);
      trains.set(color, cards);
      this.bag.update((bag) => bag.push(removed));
    });
  }

  /** Scraps a card, discarding it and returning its goods to the bag. */
  scrap(color: PlayerColor, index: number): TrainCard {
    const card = this.trainsFor(color)[index];
    assert(card != null, `no train at index ${index}`);
    this.playerTrains.update((trains) => {
      const cards = [...trains.get(color)!];
      cards.splice(index, 1);
      trains.set(color, cards);
    });
    if (card.goods.length > 0) {
      this.bag.update((bag) => bag.push(...card.goods));
    }
    return card;
  }
}
