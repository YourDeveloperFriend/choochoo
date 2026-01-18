import { PhaseEngine } from "../../engine/game/phase";
import { Phase } from "../../engine/state/phase";
import { insertAfter, remove } from "../../utils/functions";
import { SharesPhase } from "../../engine/shares/phase";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ROUND } from "../../engine/game/round";
import { THE_LOOP_DEMAND } from "./starter";
import { Good, goodToString } from "../../engine/state/good";
import { assert } from "../../utils/validate";
import { GridHelper } from "../../engine/map/grid_helper";
import { THE_LOOP_SAME_CITY } from "./grid";
import { SpaceType } from "../../engine/state/location_type";
import { Log } from "../../engine/game/log";

export class ChicagoLPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return insertAfter(
      remove(super.phaseOrder(), Phase.GOODS_GROWTH),
      Phase.TURN_ORDER,
      Phase.GOVERNMENT_BUILD,
    );
  }
}

export class ChicagoLSharesPhase extends SharesPhase {
  private readonly log = inject(Log);
  private readonly currentRound = injectState(ROUND);
  private readonly theLoopDemand = injectState(THE_LOOP_DEMAND);
  private readonly gridHelper = inject(GridHelper);

  onStart(): void {
    super.onStart();

    const nextLoopColor: Good = this.theLoopDemand()[0];
    this.theLoopDemand.update((demand) => {
      demand.splice(0, 1);
    });

    for (const city of this.gridHelper.findAllCities()) {
      if (city.data.sameCity === THE_LOOP_SAME_CITY) {
        this.gridHelper.update(city.coordinates, (city) => {
          assert(city.type === SpaceType.CITY);
          city.color = nextLoopColor;
        });
      }
    }
    this.log.log(
      "The loop demand was changed to " + goodToString(nextLoopColor),
    );
  }
}
