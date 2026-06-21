import { injectState } from "../../engine/framework/execution_context";
import { City } from "../../engine/map/city";
import { Space } from "../../engine/map/grid";
import { PlayerColor } from "../../engine/state/player";
import { LOCO_TRACK, LocoTrackPosition } from "./state";
import { describeBox, engineLevel, LocoRow, multiplier } from "./track_data";
import { MOSCOW } from "./grid";

export function isMoscow(space: Space | undefined): space is City {
  return space instanceof City && space.name() === MOSCOW;
}

export class StalinistRussiaLocoHelper {
  private readonly locoTrack = injectState(LOCO_TRACK);

  getPosition(color: PlayerColor): LocoTrackPosition {
    // Box 0 is identical on both rows, so the row choice is irrelevant there.
    return this.locoTrack().get(color) ?? { box: 0, row: LocoRow.MANY };
  }

  getEngineLevel(color: PlayerColor): number {
    const { box, row } = this.getPosition(color);
    return engineLevel(box, row);
  }

  getMultiplier(color: PlayerColor): number {
    const { box, row } = this.getPosition(color);
    return multiplier(box, row);
  }

  describe(color: PlayerColor): string {
    const { box, row } = this.getPosition(color);
    return describeBox(box, row);
  }
}
