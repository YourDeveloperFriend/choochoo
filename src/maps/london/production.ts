import { PhaseEngine } from "../../engine/game/phase";
import { Phase } from "../../engine/state/phase";
import {remove} from "../../utils/functions";

export class LondonPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return remove(super.phaseOrder(), Phase.GOODS_GROWTH);
  }
}
