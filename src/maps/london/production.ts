import { PhaseEngine } from "../../engine/game/phase";
import { Phase } from "../../engine/state/phase";

export class LondonPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    // No goods growth phase in London
    const previous = super.phaseOrder();
    previous.splice(previous.indexOf(Phase.GOODS_GROWTH), 1);
    return previous;
  }
}
