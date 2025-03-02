import { injectState } from "../../engine/framework/execution_context";
import { PhaseEngine } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { RoundEngine } from "../../engine/game/round";
import { GRID, injectGrid, injectInGamePlayers } from "../../engine/game/state";
import { isCity } from "../../engine/map/city";
import { isLand } from "../../engine/map/location";
import { SpaceType } from "../../engine/state/location_type";
import { Phase } from "../../engine/state/phase";
import { remove } from "../../utils/functions";
import { DELIVERY_RESTRICTION } from "./delivery";
import { EarthToHeavenPhase } from "./earth_to_heaven";
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

export class SoulTrainRoundEngine extends RoundEngine {
  private readonly restriction = injectState(DELIVERY_RESTRICTION);
  private readonly gridData = injectState(GRID);
  private readonly players = injectInGamePlayers();
  private readonly grid = injectGrid();

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
      return super.start(1);
    }
    return super.start(roundNumber);
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

    for (const coordinates of toRemove) {
      const space = this.grid().get(coordinates);
      if (!isLand(space)) continue;
      for (const track of space.getTrack()) {
        const owner = track.getOwner();
        if (owner == null) continue;
        playerTrack.set(owner, playerTrack.get(owner)! + 1);
      }
    }

    this.gridData.update((state) => {
      for (const coordinates of toRemove) {
        state.delete(coordinates);
      }
    });

    const dangler = this.grid().getAllDanglers();

    
  }

  maxRounds(): number {
    return this.isHeaven() ? 2 : Infinity;
  }
}
