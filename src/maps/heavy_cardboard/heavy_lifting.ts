import z from "zod";
import { BuildPhase } from "../../engine/build/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { PlayerHelper } from "../../engine/game/player";
import { ROUND } from "../../engine/game/round";
import {
  BAG,
  injectCurrentPlayer,
  injectPlayerAction,
} from "../../engine/game/state";
import { City } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { Land } from "../../engine/map/location";
import { MoveHelper } from "../../engine/move/helper";
import { MovePhase } from "../../engine/move/phase";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { GoodZod } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { allDirections } from "../../engine/state/tile";
import { Coordinates, CoordinatesZod } from "../../utils/coordinates";
import { ImmutableSet } from "../../utils/immutable";
import { assert } from "../../utils/validate";

export class HeavyCardboardBuildPhase extends BuildPhase {
  configureActions(): void {
    super.configureActions();
    this.installAction(HeavyLiftingAction);
  }
}

export const HeavyLiftingData = z.object({
  startingCity: CoordinatesZod,
  endingCity: CoordinatesZod,
  good: GoodZod,
});
export type HeavyLiftingData = z.infer<typeof HeavyLiftingData>;

const HeavyLiftingState = z.object({
  usedHeavyLifting: z.boolean(),
});

type HeavyLiftingState = z.infer<typeof HeavyLiftingState>;

const HEAVY_LIFTING = new Key("heavyLifting", {
  parse: HeavyLiftingState.parse,
});

export class HeavyCardboardMovePhase extends MovePhase {
  private readonly heavyLifting = injectState(HEAVY_LIFTING);

  configureActions(): void {
    super.configureActions();
    this.installAction(HeavyLiftingAction);
  }

  onStart(): void {
    super.onStart();
    this.heavyLifting.initState({ usedHeavyLifting: false });
  }

  onEnd(): void {
    this.heavyLifting.delete();
    super.onEnd();
  }
}

export class HeavyLiftingAction implements ActionProcessor<HeavyLiftingData> {
  static readonly action = "heavy-lifting";

  private readonly heavyLifting = injectState(HEAVY_LIFTING);
  private readonly moveHelper = inject(MoveHelper);
  private readonly gridHelper = inject(GridHelper);
  private readonly playerHelper = inject(PlayerHelper);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly heavyPlayer = injectPlayerAction(Action.HEAVY_LIFTING);
  private readonly round = injectState(ROUND);
  private readonly bag = injectState(BAG);

  assertInput = HeavyLiftingData.parse;

  canEmit(): boolean {
    return (
      this.currentPlayer().color === this.heavyPlayer()?.color &&
      this.heavyLifting.isInitialized() &&
      !this.heavyLifting().usedHeavyLifting
    );
  }

  validate(data: HeavyLiftingData): void {
    const startingCity = this.gridHelper.lookup(data.startingCity);
    const endingCity = this.gridHelper.lookup(data.endingCity);
    assert(startingCity instanceof City, {
      invalidInput: "must start from a city",
    });
    assert(endingCity instanceof City, {
      invalidInput: "must start from a city",
    });
    assert(startingCity.name() !== "Madeira", {
      invalidInput: "cannot deliver from Madeira",
    });
    assert(endingCity.name() !== "Madeira", {
      invalidInput: "cannot deliver to Madeira",
    });

    assert(startingCity.getGoods().includes(data.good), {
      invalidInput: "selected good not found at starting city",
    });
    assert(this.moveHelper.canDeliverTo(endingCity, data.good), {
      invalidInput: "must deliver to matching city",
    });

    const canTrace = this.canTracePath(
      startingCity.coordinates,
      endingCity.coordinates,
    );
    assert(canTrace, {
      invalidInput: "must be within 6 spaces",
    });
  }

  private canTracePath(
    current: Coordinates,
    destination: Coordinates,
    distance = 6,
    checked = new Set<Coordinates>(),
  ): boolean {
    return allDirections.some((direction) =>
      this.withinDistance(
        current.neighbor(direction),
        destination,
        distance,
        checked,
      ),
    );
  }

  private withinDistance(
    current: Coordinates,
    destination: Coordinates,
    distance: number,
    checked: Set<Coordinates>,
  ): boolean {
    if (checked.has(current)) return false;
    checked.add(current);
    if (current === destination) return true;
    const space = this.gridHelper.lookup(current);
    if (!(space instanceof Land)) return false;
    if (space.getTrack().length > 0) return false;
    const newDistance =
      distance - (space.getLandType() === SpaceType.MOUNTAIN ? 2 : 1);
    if (newDistance < 0) return false;
    return this.canTracePath(current, destination, newDistance, checked);
  }

  process(data: HeavyLiftingData): boolean {
    this.playerHelper.updateCurrentPlayer((player) => {
      player.income += Math.min(6, 1 + this.round());
    });
    this.gridHelper.update(data.startingCity, (city) => {
      city.goods!.splice(city.goods!.indexOf(data.good), 1);
    });
    this.bag.update((goods) => goods.push(data.good));
    this.heavyLifting.update((state) => ({ ...state, usedHeavyLifting: true }));
    return true;
  }
}

export class HeavyCardboardActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super
      .getActions()
      .remove(Action.PRODUCTION)
      .add(Action.HEAVY_LIFTING);
  }
}
