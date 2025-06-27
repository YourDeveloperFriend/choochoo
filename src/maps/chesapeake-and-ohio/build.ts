import { BuildPhase } from "../../engine/build/phase";
import { BuildAction, BuildData } from "../../engine/build/build";
import { ActionProcessor } from "../../engine/game/action";
import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import {
  CURRENT_PLAYER,
  injectCurrentPlayer,
  injectGrid,
} from "../../engine/game/state";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { inject, injectState } from "../../engine/framework/execution_context";
import { GridHelper } from "../../engine/map/grid_helper";
import { Key } from "../../engine/framework/key";
import { MoneyManager } from "../../engine/game/money_manager";
import { BUILD_STATE } from "../../engine/build/state";
import { Log } from "../../engine/game/log";
import { PlayerColorZod } from "../../engine/state/player";
import { FACTORY_ACTION } from "./actions";

export const HAS_BUILT_FACTORY = new Key("hasBuiltFactory", {
  parse: z.boolean().parse,
});

export class ChesapeakeAndOhioBuildPhase extends BuildPhase {
  private readonly hasBuiltFactory = injectState(HAS_BUILT_FACTORY);

  configureActions() {
    super.configureActions();
    this.installAction(BuildFactoryAction);
  }

  onStartTurn(): void {
    this.hasBuiltFactory.initState(false);
    return super.onStartTurn();
  }

  onEndTurn(): void {
    this.hasBuiltFactory.delete();
    return super.onEndTurn();
  }
}

export const ChesapeakeAndOhioMapData = z.object({
  factoryColor: PlayerColorZod.optional(),
});
export type ChesapeakeAndOhioMapData = z.infer<typeof ChesapeakeAndOhioMapData>;

export const BuildFactoryData = z.object({
  coordinates: CoordinatesZod,
});

export type BuildFactoryData = z.infer<typeof BuildFactoryData>;

export class ChesapeakeAndOhioBuildAction extends BuildAction {
  private readonly hasBuiltFactory = injectState(HAS_BUILT_FACTORY);

  process(data: BuildData): boolean {
    const result = super.process(data);
    if (
      this.currentPlayer().selectedAction === FACTORY_ACTION &&
      this.hasBuiltFactory() === false
    ) {
      return false;
    }
    return result;
  }
}

export class BuildFactoryAction implements ActionProcessor<BuildFactoryData> {
  static readonly action = "build-factory";
  protected readonly grid = injectGrid();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly currentPlayerColor = injectState(CURRENT_PLAYER);
  private readonly hasBuiltFactory = injectState(HAS_BUILT_FACTORY);
  private readonly moneyManager = inject(MoneyManager);
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly log = inject(Log);

  readonly assertInput = BuildFactoryData.parse;
  validate(data: BuildFactoryData): void {
    const space = this.grid().get(data.coordinates);
    assert(space !== undefined, { invalidInput: "Invalid coordinates" });
    assert(space instanceof City, {
      invalidInput: "Can only create factories on cities",
    });
    const mapData = space.getMapSpecific(ChesapeakeAndOhioMapData.parse);
    assert(mapData?.factoryColor === undefined, {
      invalidInput:
        "Can only create a factory on a city where a factory has not been built.",
    });

    assert(this.hasBuiltFactory() === false, {
      invalidInput: "You have already built a factory this turn.",
    });

    const currentPlayer = this.currentPlayer();
    assert(currentPlayer.money >= 8, {
      invalidInput: "You don't have enough money to build a factory.",
    });
    assert(
      currentPlayer.selectedAction === FACTORY_ACTION ||
        this.buildState().previousBuilds.length === 0,
      {
        invalidInput:
          "Building a factory must be your entire build turn unless you take the factory action.",
      },
    );
  }

  process(data: BuildFactoryData): boolean {
    this.log.currentPlayer(
      "builds a factory at " + this.gridHelper.displayName(data.coordinates),
    );
    this.gridHelper.update(data.coordinates, (space) => {
      if (!space.mapSpecific) {
        space.mapSpecific = {};
      }
      space.mapSpecific.factoryColor = this.currentPlayerColor();
    });
    this.moneyManager.addMoneyForCurrentPlayer(-8);
    this.hasBuiltFactory.set(true);

    if (this.currentPlayer().selectedAction !== FACTORY_ACTION) {
      return true;
    }
    return this.buildState().previousBuilds.length >= 3;
  }
}
