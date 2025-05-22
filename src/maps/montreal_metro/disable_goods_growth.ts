import { injectState } from "../../engine/framework/execution_context";
import { PhaseEngine } from "../../engine/game/phase";
import { GameStarter } from "../../engine/game/starter";
import { Phase } from "../../engine/state/phase";
import { eligiblePlayerColors, PlayerColor } from "../../engine/state/player";
import { remove } from "../../utils/functions";
import {
  GOVERNMENT_COLOR,
  GOVERNMENT_ENGINE_LEVEL,
} from "./government_engine_level";
import { GOVERNMENT_TRACK } from "./government_track";

export class MontrealMetroPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return [
      Phase.GOVERNMENT_BUILD,
      ...remove(super.phaseOrder(), Phase.GOODS_GROWTH),
    ];
  }
}

export class MontrealMetroStarter extends GameStarter {
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);
  private readonly govtTrack = injectState(GOVERNMENT_TRACK);

  onStartGame(): void {
    this.govtTrack.initState(this.turnOrder());
    this.govtEngineLevel.initState(
      new Map(this.players().map((player) => [player.color, 0])),
    );
  }

  protected numCubesForAvailableCity(): number {
    return 1;
  }

  eligiblePlayerColors(): PlayerColor[] {
    return remove(eligiblePlayerColors, GOVERNMENT_COLOR);
  }

  isProductionEnabled(): boolean {
    return false;
  }
}
