import { z } from "zod";
import { inject } from "../../engine/framework/execution_context";
import {
  ActionProcessor,
  EmptyActionProcessor,
} from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { ActionBundle, PhaseModule } from "../../engine/game/phase_module";
import { injectCurrentPlayer } from "../../engine/game/state";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { TrainHelper } from "./trains";
import { MAX_TRAINS_PER_PLAYER } from "./train_data";

/**
 * The Buy Trains step. It reuses Stalinist Russia's extra locomotive phase --
 * both maps insert a purchasing step between action selection and building --
 * and is renamed for this map by IsleOfWightPhaseNamingProvider.
 */
export class IsleOfWightBuyTrainsPhase extends PhaseModule {
  static readonly phase = Phase.STALINIST_LOCOMOTIVE;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);

  configureActions(): void {
    this.installAction(BuyTrainsAction);
    this.installAction(BuyTrainsPassAction);
  }

  /** Trains are bought in reverse player order. */
  getPlayerOrder(): PlayerColor[] {
    return [...super.getPlayerOrder()].reverse();
  }

  forcedAction(): ActionBundle<object> | undefined {
    const player = this.currentPlayer();
    const tier = this.trainHelper.lowestAvailableTier();
    const canBuy =
      tier != null &&
      this.trainHelper.trainSlotsRemaining(player.color) > 0 &&
      (player.money >= this.trainHelper.costOf(tier, 0) ||
        this.trainHelper.couponsFor(player.color) > 0);
    if (!canBuy) {
      return { action: BuyTrainsPassAction, data: {} };
    }
    return undefined;
  }
}

export const BuyTrainsData = z.object({
  coupons: z.number().min(0).max(2),
});
export type BuyTrainsData = z.infer<typeof BuyTrainsData>;

export class BuyTrainsAction implements ActionProcessor<BuyTrainsData> {
  static readonly action = "buyTrains";
  readonly assertInput = BuyTrainsData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly trainHelper = inject(TrainHelper);
  private readonly log = inject(Log);

  canEmit(): boolean {
    return true;
  }

  validate(data: BuyTrainsData): void {
    const player = this.currentPlayer();
    assert(this.trainHelper.trainSlotsRemaining(player.color) > 0, {
      invalidInput: `cannot hold more than ${MAX_TRAINS_PER_PLAYER} trains`,
    });

    assert(this.trainHelper.couponsFor(player.color) >= data.coupons, {
      invalidInput: "not enough Haggle coupons",
    });

    const tier = this.trainHelper.lowestAvailableTier();
    assert(tier != null, { invalidInput: "no trains left to buy" });
    const cost = this.trainHelper.costOf(tier, data.coupons);
    assert(player.money >= cost, {
      invalidInput: `cannot afford the purchase (costs $${cost})`,
    });
  }

  process(data: BuyTrainsData): boolean {
    const color = this.currentPlayer().color;
    const tier = this.trainHelper.lowestAvailableTier()!;
    const cost = this.trainHelper.costOf(tier, data.coupons);
    this.trainHelper.buy(color, tier, data.coupons);
    const couponStr =
      data.coupons === 0
        ? ""
        : ` (using ${data.coupons} Haggle coupon${data.coupons === 1 ? "" : "s"})`;
    this.log.currentPlayer(`buys a ${tier}-train for $${cost}${couponStr}`);

    // Player can keep buying additional trains until the forceAction does a pass to end their turn
    return false;
  }
}

export class BuyTrainsPassAction extends EmptyActionProcessor {
  static readonly action = "buyTrainsPass";

  private readonly log = inject(Log);

  process(): boolean {
    this.log.currentPlayer("does not buy any more trains");
    return true;
  }
}
