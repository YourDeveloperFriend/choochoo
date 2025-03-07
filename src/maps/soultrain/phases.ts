import { inject, injectState } from "../../engine/framework/execution_context";
import { PhaseEngine } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { PlayerHelper } from "../../engine/game/player";
import { RoundEngine } from "../../engine/game/round";
import { GRID, injectGrid, injectInGamePlayers } from "../../engine/game/state";
import { isCity } from "../../engine/map/city";
import { GridHelper } from "../../engine/map/grid_helper";
import { GridVersionHelper } from "../../engine/map/grid_version_helper";
import { isLand } from "../../engine/map/location";
import { AllowedActions } from "../../engine/select_action/allowed_actions";
import { Action } from "../../engine/state/action";
import { SpaceType } from "../../engine/state/location_type";
import { Phase } from "../../engine/state/phase";
import { CityData } from "../../engine/state/space";
import { Direction } from "../../engine/state/tile";
import { remove } from "../../utils/functions";
import { ImmutableSet } from "../../utils/immutable";
import { assert } from "../../utils/validate";
import { DELIVERY_RESTRICTION } from "./delivery";
import { EarthToHeavenPhase, TO_URBANIZE } from "./earth_to_heaven";
import { heaven } from "./grid";
import { Dimension, SoulTrainMapData } from "./map_data";

export class SoulTrainPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return [
      Phase.EARTH_TO_HEAVEN,
      ...remove(super.phaseOrder(), Phase.GOODS_GROWTH),
    ];
  }
}

export class SoulTrainPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(EarthToHeavenPhase);
  }
}

export class SoulTrainAllowedActions extends AllowedActions {
  getActions(): ImmutableSet<Action> {
    return super
      .getActions()
      .filterNot((action) => action === Action.PRODUCTION);
  }
}

export class SoulTrainRoundEngine extends RoundEngine {
  private readonly restriction = injectState(DELIVERY_RESTRICTION);
  private readonly gridData = injectState(GRID);
  private readonly players = injectInGamePlayers();
  private readonly playerHelper = inject(PlayerHelper);
  private readonly gridHelper = inject(GridHelper);
  private readonly gridVersionHelper = inject(GridVersionHelper);
  private readonly grid = injectGrid();
  private readonly toUrbanize = injectState(TO_URBANIZE);

  private isHeaven(): boolean {
    return this.restriction().to === Dimension.HEAVEN;
  }

  start(roundNumber: number): void {
    if (this.isHeaven()) return super.start(roundNumber);
    const count = [...this.grid().values()]
      .filter(
        (space) =>
          space.getGoods().length > 0 &&
          space.getMapSpecific(SoulTrainMapData.parse)?.dimension ==
            Dimension.HELL,
      )
      .map((space) => space.getGoods().length)
      .reduce((a, b) => a + b, 0);
    if (count <= 10) {
      this.cleanUpHell();
      this.addHeaven();
      return super.start(1);
    }
    return super.start(roundNumber);
  }

  private addHeaven() {
    const topLeft = [...this.grid().values()].find(
      (space) => space.getMapSpecific(SoulTrainMapData.parse)?.topLeft,
    );

    assert(topLeft != null, "The top left of the map does not exist");
    let start = topLeft.coordinates;
    for (const [index, column] of heaven.entries()) {
      let current = start;
      for (const land of column.reverse()) {
        current = current.neighbor(Direction.TOP);
        if (land == null) continue;
        this.gridHelper.set(current, land);
      }
      start = start.neighbor(
        index % 2 === 0 ? Direction.TOP_RIGHT : Direction.BOTTOM_RIGHT,
      );
    }

    this.gridVersionHelper.updateGridVersion();
  }

  private cleanUpHell() {
    const toRemove = [...this.grid().entries()]
      .filter(
        ([_, value]) =>
          value.data.type === SpaceType.FIRE ||
          (isCity(value) &&
            value.getMapSpecific(SoulTrainMapData.parse)!.dimension ===
              Dimension.HELL),
      )
      .map(([key]) => key);

    const playerTrack = new Map(
      this.players().map((player) => [player.color, 0]),
    );

    const urbanizedCities: CityData[] = [];

    for (const coordinates of toRemove) {
      const space = this.grid().get(coordinates);
      if (isCity(space) && space.isUrbanized()) {
        urbanizedCities.push(space.data);
      }
      if (isLand(space)) {
        for (const track of space.getTrack()) {
          const owner = track.getOwner();
          if (owner == null) continue;
          playerTrack.set(owner, playerTrack.get(owner)! + 1);
        }
      }
    }

    this.toUrbanize.initState(
      urbanizedCities.map((city) =>
        Array.isArray(city.color) ? city.color[0] : city.color,
      ),
    );

    this.gridData.update((state) => {
      for (const coordinates of toRemove) {
        state.delete(coordinates);
      }
    });

    const danglers = this.grid().getAllDanglers();
    for (const dangler of danglers) {
      const route = this.grid().getRoute(dangler);
      for (const track of route) {
        this.gridHelper.removeTrack(track);
        const owner = track.getOwner();
        if (owner == null) continue;
        playerTrack.set(owner, playerTrack.get(owner)! + 1);
      }
    }

    for (const [playerColor, count] of playerTrack) {
      this.playerHelper.update(playerColor, (data) => {
        data.income += Math.floor(count / 3);
      });
    }
  }

  maxRounds(): number {
    return this.isHeaven() ? 2 : Infinity;
  }
}
