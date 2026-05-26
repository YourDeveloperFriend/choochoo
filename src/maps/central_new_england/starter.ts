import { GameStarter } from "../../engine/game/starter";
import { injectState } from "../../engine/framework/execution_context";
import { ActionMoney } from "./action_selection";

export class CentralNewEnglandStarter extends GameStarter {
  private readonly actionMoney = injectState(ActionMoney);

  protected onStartGame(): void {
    super.onStartGame();
    this.actionMoney.initState(new Map());
  }

  isGoodsGrowthEnabled(): boolean {
    return false;
  }
}
