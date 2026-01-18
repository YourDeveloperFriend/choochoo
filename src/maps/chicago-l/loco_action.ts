import { LocoAction } from "../../engine/move/loco";
import { injectInGamePlayers } from "../../engine/game/state";
import { assert, fail } from "../../utils/validate";
import { injectState } from "../../engine/framework/execution_context";
import { GOVERNMENT_ENGINE_LEVEL } from "./starter";

export class ChicagoLLocoAction extends LocoAction {
  protected readonly players = injectInGamePlayers();
  private readonly govtEngineLevel = injectState(GOVERNMENT_ENGINE_LEVEL);

  validate(): void {
    const player = this.currentPlayer();
    assert(!this.hasReachedLocoLimit(), {
      invalidInput: "can only loco once per round",
    });
    const maxLoco = this.getMaxLoco(this.govtEngineLevel().get(player.color)!);
    assert(player.locomotive < maxLoco, {
      invalidInput: `cannot loco to more than ${maxLoco} at the current government level`,
    });
  }

  private getMaxLoco(govtLevel: number): number {
    switch (govtLevel) {
      case 0:
        return 3;
      case 1:
        return 4;
      case 2:
        return 5;
      case 3:
        return 6;
      case 4:
        return 7;
      default:
        fail("Invalid government loco level: " + govtLevel);
    }
  }
}
