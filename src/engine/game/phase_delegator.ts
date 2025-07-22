import { assert } from "../../utils/validate";
import { BuildPhase } from "../build/phase";
import { inject, injectState } from "../framework/execution_context";
import { GoodsGrowthPhase } from "../goods_growth/phase";
import { ExpensesPhase } from "../income_and_expenses/expenses";
import { IncomePhase } from "../income_and_expenses/income";
import { IncomeReductionPhase } from "../income_and_expenses/reduction";
import { MovePhase } from "../move/phase";
import { SelectActionPhase } from "../select_action/phase";
import { SharesPhase } from "../shares/phase";
import { Phase } from "../state/phase";
import { TurnOrderPhase } from "../turn_order/phase";
import { PHASE } from "./phase";
import { PhaseModule } from "./phase_module";

export interface PhaseConstructor {
  new (): PhaseModule;

  readonly phase: Phase;
}

export class PhaseDelegator {
  private readonly currentPhase = injectState(PHASE);
  private readonly phases = new Map<Phase, PhaseModule>();

  constructor() {
    this.install(SharesPhase);
    this.install(BuildPhase);
    this.install(TurnOrderPhase);
    this.install(SelectActionPhase);
    this.install(MovePhase);
    this.install(IncomePhase);
    this.install(ExpensesPhase);
    this.install(IncomeReductionPhase);
    this.install(GoodsGrowthPhase);
  }

  install(ctor: PhaseConstructor): void {
    const phase = inject(ctor);
    assert(
      !this.phases.has(ctor.phase),
      `duplicate installs of phase key ctor=${ctor.name} phase=${ctor.phase}`,
    );
    phase.configureActions();
    this.phases.set(ctor.phase, phase);
  }

  get(): PhaseModule {
    const currentPhase = this.currentPhase();
    const processor = this.phases.get(this.currentPhase());
    assert(
      processor != null,
      `No phase processor found for ${currentPhase}. Available Phases: ${[...this.phases.keys()]}`,
    );
    return processor;
  }
}
