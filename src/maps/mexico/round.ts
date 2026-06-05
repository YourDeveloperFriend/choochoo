import { inject, injectState } from "../../engine/framework/execution_context";
import { GameMemory } from "../../engine/game/game_memory";
import { MoneyManager } from "../../engine/game/money_manager";
import { Random } from "../../engine/game/random";
import { RoundEngine } from "../../engine/game/round";
import { injectAllPlayersUnsafe, injectGrid } from "../../engine/game/state";
import { Action, ActionNamingProvider } from "../../engine/state/action";
import { Good } from "../../engine/state/good";
import { MEXICO_DISABLED_ACTIONS } from "./allowed_actions";
import { MexicoRoleHelper } from "./roles";
import { MexicoVariantConfig } from "./variant_config";

const BASE_ELIGIBLE_ACTIONS_FOR_RANDOM_DISABLE = [
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
  private readonly gameMemory = inject(GameMemory);
  private readonly allPlayers = injectAllPlayersUnsafe();

  maxRounds(): number {
    return 9;
  }

  start(round: number): void {
    const { deterministicActions, productionForAll } =
      this.gameMemory.getVariant(MexicoVariantConfig.parse);

    const eligible = productionForAll
      ? [...BASE_ELIGIBLE_ACTIONS_FOR_RANDOM_DISABLE, Action.PRODUCTION]
      : [...BASE_ELIGIBLE_ACTIONS_FOR_RANDOM_DISABLE];

    let disabled: Action[];
    if (deterministicActions) {
      if (round === 1) {
        disabled = [];
      } else {
        disabled = this.allPlayers()
          .map((p) => p.selectedAction)
          .filter((a): a is Action => a != null);
      }
    } else {
      disabled = this.random.shuffle(eligible).slice(0, 2);
    }

    this.disabledActions.initState({ actions: disabled });
    super.start(round);

    if (disabled.length > 0) {
      const names = disabled
        .map((a) => this.naming.getActionString(a))
        .join(" and ");
      this.log.log(`${names} are unavailable this round`);
    }
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
