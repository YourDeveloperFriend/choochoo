import { inject, injectState } from "../../engine/framework/execution_context";
import { MoneyManager } from "../../engine/game/money_manager";
import { Random } from "../../engine/game/random";
import { RoundEngine } from "../../engine/game/round";
import { injectGrid } from "../../engine/game/state";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { MEXICO_DISABLED_ACTIONS } from "./allowed_actions";
import { MexicoRoleHelper } from "./roles";

const ELIGIBLE_ACTIONS_FOR_RANDOM_DISABLE = [
  Action.FIRST_MOVE,
  Action.FIRST_BUILD,
  Action.ENGINEER,
  Action.LOCOMOTIVE,
  Action.URBANIZATION,
];

export class MexicoRoundEngine extends RoundEngine {
  private readonly random = inject(Random);
  private readonly disabledActions = injectState(MEXICO_DISABLED_ACTIONS);
  private readonly naming = inject(ActionNamingProvider);
  private readonly grid = injectGrid();
  private readonly moneyManager = inject(MoneyManager);
  private readonly roles = inject(MexicoRoleHelper);

  maxRounds(): number {
    return 9;
  }

  start(round: number): void {
    const shuffled = this.random.shuffle([
      ...ELIGIBLE_ACTIONS_FOR_RANDOM_DISABLE,
    ]);
    const disabled = shuffled.slice(0, 2);
    this.disabledActions.initState({ actions: disabled });
    super.start(round);
    const names = disabled
      .map((a) => this.naming.getActionString(a))
      .join(" and ");
    this.log.log(`${names} are unavailable this round`);
  }

  end(): void {
    this.disabledActions.delete();
    if (this.isLastRound(this.currentRound())) {
      this.applyEndGameEliminations();
    }
    super.end();
  }

  private applyEndGameEliminations(): void {
    const cities = this.grid().cities();
    const blackOnMap = cities.some((c) => c.getGoods().includes(Good.BLACK));
    const redOnMap = cities.some((c) => c.getGoods().includes(Good.RED));

    if (blackOnMap) {
      this.log.log("Black goods remain on the map — the State has failed.");
      this.moneyManager.forceOutOfGameKeepTurnOrder(this.roles.getStateColor());
    }
    if (redOnMap) {
      this.log.log("Red goods remain on the map — the Cartel has failed.");
      this.moneyManager.forceOutOfGameKeepTurnOrder(
        this.roles.getCartelColor(),
      );
    }
  }
}
