
import { remove } from "../../utils/functions";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { Log } from "../game/log";
import { ActionBundle, PhaseModule } from "../game/phase_module";
import { injectCurrentPlayer, injectGrid, injectPlayerAction } from "../game/state";
import { DanglerInfo } from "../map/grid";
import { GridHelper } from "../map/grid_helper";
import { Land } from "../map/location";
import { Action } from "../state/action";
import { Phase } from "../state/phase";
import { PlayerColor } from "../state/player";
import { BuildAction } from "./build";
import { ClaimAction } from "./claim";
import { ConnectCitiesAction } from "./connect_cities";
import { BuildDiscountManager } from "./discount";
import { DoneAction } from "./done";
import { BuilderHelper } from "./helper";
import { BUILD_STATE } from "./state";
import { UrbanizeAction } from "./urbanize";

export class BaseBuildPhase extends PhaseModule {
  protected readonly helper = inject(BuilderHelper);
  protected readonly turnState = injectState(BUILD_STATE);
  protected readonly gridHelper = inject(GridHelper);
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly grid = injectGrid();
  protected readonly log = inject(Log);
  protected readonly discountManager = inject(BuildDiscountManager);
  protected readonly firstBuildPlayer = injectPlayerAction(Action.FIRST_BUILD);

  configureActions() {
    this.installAction(BuildAction);
    this.installAction(ClaimAction);
    this.installAction(UrbanizeAction);
    this.installAction(ConnectCitiesAction);
    this.installAction(DoneAction);
  }

  onStartTurn(): void {
    super.onStartTurn();
    this.turnState.initState({
      previousBuilds: [],
      buildCount: 0,
      hasUrbanized: false,
      danglers: this.getDanglersAsInfo(this.currentPlayer().color).concat(this.getDanglersAsInfo(undefined)),
    });
  }

  getDanglersAsInfo(color?: PlayerColor): DanglerInfo[] {
    return this.grid().getDanglers(color).map((track) => ({
      coordinates: track.coordinates,
      immovableExit: this.grid().getImmovableExitReference(track),
      length: this.grid().getRoute(track).length,
    }));
  }

  protected abandonDangling() {
    const { danglers } = this.turnState();
    const grid = this.grid();
    const newDanglers = this.getDanglersAsInfo(this.currentPlayer().color);
    const toRemoveIndividual = danglers.filter((dangler) => {
      const newDangler = newDanglers.find((d) => d.coordinates.equals(dangler.coordinates) && d.immovableExit === dangler.immovableExit);
      return newDangler != null && newDangler.length <= dangler.length;
    });

    const toRemoveTrack = toRemoveIndividual.map((removing) => {
      const space = grid.get(removing.coordinates);
      assert(space instanceof Land);
      return space.trackExiting(removing.immovableExit)!;
    });

    for (const track of toRemoveTrack) {
      this.gridHelper.setRouteOwner(track, undefined);
    }
    if (toRemoveTrack.length > 0) {
      this.log.currentPlayer('abandons dangling track');
    }
  }

  onEndTurn(): void {
    this.discountManager.onBuildRoundEnd();
    this.abandonDangling();
    super.onEndTurn();
    this.turnState.delete();
  }

  getPlayerOrder(): PlayerColor[] {
    const playerOrder = super.getPlayerOrder();
    const firstBuild = this.firstBuildPlayer();
    if (firstBuild != null) {
      return [firstBuild.color, ...remove(playerOrder, firstBuild.color)];
    }
    return playerOrder;
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.helper.shouldAutoPass()) {
      return { action: DoneAction, data: {} };
    }
    return undefined;
  }
}

export class BuildPhase extends BaseBuildPhase {
  static readonly phase = Phase.BUILDING;
}