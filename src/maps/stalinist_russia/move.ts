import { peek } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../../engine/framework/execution_context";
import { injectCurrentPlayer } from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { MoveHelper } from "../../engine/move/helper";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MovePassAction } from "../../engine/move/pass";
import { MovePhase } from "../../engine/move/phase";
import { MoveValidator } from "../../engine/move/validator";
import { Action } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerData } from "../../engine/state/player";
import { isMoscow, StalinistRussiaLocoHelper } from "./loco_helper";
import { POLITBURO_USED } from "./state";
import { NUM_MOVE_ROUNDS } from "./track_data";

export class StalinistRussiaMoveHelper extends MoveHelper {
  private readonly locoHelper = inject(StalinistRussiaLocoHelper);

  getLocomotive(player: PlayerData): number {
    return this.locoHelper.getEngineLevel(player.color);
  }

  getLocomotiveDisplay(player: PlayerData): string {
    // Show engine level x delivery multiplier, e.g. "3x2".
    return this.locoHelper.describe(player.color);
  }

  canDeliverTo(city: City, good: Good): boolean {
    if (isMoscow(city)) {
      // Moscow only accepts colors of cubes not already present in the city.
      return !city.getGoods().includes(good);
    }
    return super.canDeliverTo(city, good);
  }
}

export class StalinistRussiaMoveValidator extends MoveValidator {
  private readonly politburoUsed = injectState(POLITBURO_USED);

  validatePartial(player: PlayerData, action: MoveData): void {
    if (isMoscow(this.grid().get(action.startingCity))) {
      assert(player.selectedAction === Action.POLITBURO_DIRECTIVE, {
        invalidInput:
          "goods can only be moved out of Moscow with the Politburo Directive",
      });
      const used = this.politburoUsed.isInitialized()
        ? this.politburoUsed()
        : [];
      assert(!used.includes(player.color), {
        invalidInput:
          "the Politburo Directive may only be applied to a single delivery",
      });
    }
    super.validatePartial(player, action);
  }
}

export class StalinistRussiaMoveAction extends MoveAction {
  private readonly politburoUsed = injectState(POLITBURO_USED);

  process(action: MoveData): boolean {
    const startedFromMoscow = isMoscow(this.grid().get(action.startingCity));
    const result = super.process(action);
    if (startedFromMoscow) {
      this.politburoUsed.update((used) =>
        used.push(this.currentPlayer().color),
      );
    }
    return result;
  }

  protected returnToBag(action: MoveData): void {
    const endingStop = peek(action.path).endingStop;
    if (isMoscow(this.grid().get(endingStop))) {
      // Cubes delivered to Moscow are left on the city rather than returned.
      this.gridHelper.update(endingStop, (space) => {
        assert(space.type === SpaceType.CITY);
        space.goods.push(action.good);
      });
      return;
    }
    super.returnToBag(action);
  }
}

export class StalinistRussiaMovePhase extends MovePhase {
  private readonly currentPlayerData = injectCurrentPlayer();
  private readonly locoHelper = inject(StalinistRussiaLocoHelper);
  private readonly politburo = injectState(POLITBURO_USED);

  configureActions(): void {
    // Note: LocoAction is intentionally not installed. On this map players
    // cannot skip deliveries to increase their locomotive.
    this.installAction(MoveAction);
    this.installAction(MovePassAction);
  }

  onStart(): void {
    super.onStart();
    this.politburo.initState([]);
  }

  onEnd(): void {
    this.politburo.delete();
    super.onEnd();
  }

  numMoveRounds(): number {
    return NUM_MOVE_ROUNDS;
  }

  checkSkipTurn(): boolean {
    // A player participates in delivery round R (0-indexed) only if their
    // locomotive multiplier allows that many deliveries.
    const multiplier = this.locoHelper.getMultiplier(
      this.currentPlayerData().color,
    );
    return this.moveState().moveRound >= multiplier;
  }

  protected getAutoAction(): undefined {
    // The locomotive auto-action is not available on this map.
    return undefined;
  }
}
