import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { EmptyActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { MoneyManager } from "../../engine/game/money_manager";
import { PhaseEngine } from "../../engine/game/phase";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { ActionBundle, PhaseModule } from "../../engine/game/phase_module";
import { RoundEngine } from "../../engine/game/round";
import {
  injectCurrentPlayer,
  injectPlayerAction,
  TURN_ORDER,
} from "../../engine/game/state";
import { Action } from "../../engine/state/action";
import { Phase } from "../../engine/state/phase";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { assert } from "../../utils/validate";

const StLuciaState = z.object({
  firstPlayer: PlayerColorZod,
});
type StLuciaState = z.infer<typeof StLuciaState>;

const ST_LUCIA_STATE = new Key("stLuciaState", { parse: StLuciaState.parse });

const StLuciaTurnOrderState = z.object({
  newTurnOrder: PlayerColorZod.array().optional(),
});
type StLuciaTurnOrderState = z.infer<typeof StLuciaTurnOrderState>;

const TURN_ORDER_STATE = new Key("stLuciaTurnOrder", {
  parse: StLuciaTurnOrderState.parse,
});

class StLuciaTurnOrderHelper {
  private readonly state = injectState(TURN_ORDER_STATE);
  private readonly turnOrder = injectState(TURN_ORDER);

  beginTurnOrderPhase(): void {
    this.state.initState({});
  }

  claimFirstPlayer(firstPlayer: PlayerColor): void {
    this.claimPlayer(firstPlayer, true);
  }

  private claimPlayer(player: PlayerColor, isFirst: boolean): void {
    const [first, second] = this.turnOrder();
    const other = player === first ? second : first;
    const newTurnOrder = [player, other];
    if (!isFirst) {
      newTurnOrder.reverse();
    }
    this.state.update((state) => (state.newTurnOrder = newTurnOrder));
  }

  resolveEndRound(): void {
    const { newTurnOrder } = this.state();
    if (newTurnOrder != null) {
      this.turnOrder.set(newTurnOrder);
    }
    this.state.delete();
  }

  shouldFinishEarly(): boolean {
    return this.state().newTurnOrder != null;
  }
}

export class StLuciaBidAction extends EmptyActionProcessor {
  static readonly action = "stLuciaBid";
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly log = inject(Log);
  private readonly helper = inject(StLuciaTurnOrderHelper);
  private readonly moneyManager = inject(MoneyManager);
  private readonly turnOrder = injectState(TURN_ORDER);

  validate(): void {
    assert(this.currentPlayer().money >= 5, {
      invalidInput: "cannot afford bid",
    });
  }

  process(): boolean {
    this.helper.claimFirstPlayer(this.currentPlayer().color);
    this.moneyManager.addMoneyForCurrentPlayer(-5);
    this.log.currentPlayer("claims first for $5");
    return true;
  }
}

export class StLuciaPassAction extends EmptyActionProcessor {
  static readonly action = "stLuciaPass";
  private readonly log = inject(Log);

  process(): boolean {
    this.log.currentPlayer("passes");
    return true;
  }
}

export class StLuciaTurnOrderPhase extends PhaseModule {
  static readonly phase = Phase.ST_LUCIA_TURN_ORDER;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly helper = inject(StLuciaTurnOrderHelper);

  configureActions() {
    this.installAction(StLuciaBidAction);
    this.installAction(StLuciaPassAction);
  }

  onStart(): void {
    super.onStart();
    this.helper.beginTurnOrderPhase();
  }

  onEnd(): void {
    this.helper.resolveEndRound();
    super.onEnd();
  }

  forcedAction(): ActionBundle<object> | undefined {
    if (this.currentPlayer().money < 5) {
      return {
        action: StLuciaPassAction,
        data: {},
      };
    }
  }

  findNextPlayer(currentPlayer: PlayerColor): PlayerColor | undefined {
    if (this.helper.shouldFinishEarly()) {
      return undefined;
    }
    return super.findNextPlayer(currentPlayer);
  }
}

export class StLuciaPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(StLuciaTurnOrderPhase);
  }
}

export class StLuciaPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return [
      Phase.ST_LUCIA_TURN_ORDER,
      Phase.SHARES,
      Phase.ACTION_SELECTION,
      Phase.BUILDING,
      Phase.MOVING,
      Phase.INCOME,
      Phase.EXPENSES,
      Phase.INCOME_REDUCTION,
    ];
  }
}

export class StLuciaRoundEngine extends RoundEngine {
  private readonly state = injectState(ST_LUCIA_STATE);
  private readonly turnOrder = injectState(TURN_ORDER);
  private readonly turnOrderPass = injectPlayerAction(Action.TURN_ORDER_PASS);

  start(round: number): void {
    if (round === 1) {
      this.state.initState({ firstPlayer: this.turnOrder()[0] });
    } else {
      const previousFirstPlayer = this.state().firstPlayer;
      const otherPlayer =
        this.turnOrder()[0] === previousFirstPlayer
          ? this.turnOrder()[1]
          : this.turnOrder()[0];
      this.state.set({ firstPlayer: otherPlayer });
      const realFirstPlayer = this.turnOrderPass();
      if (realFirstPlayer != null) {
        this.turnOrder.set([
          realFirstPlayer.color,
          previousFirstPlayer == realFirstPlayer.color
            ? otherPlayer
            : previousFirstPlayer,
        ]);
      } else {
        this.turnOrder.set([otherPlayer, previousFirstPlayer]);
      }
    }

    return super.start(round);
  }

  maxRounds(): number {
    return 8;
  }
}
