import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { PhaseEngine } from "../engine/game/phase";
import {
  PhaseConstructor,
  PhaseDelegator,
} from "../engine/game/phase_delegator";
import { Module } from "../engine/module/module";
import { Phase } from "../engine/state/phase";

type ReplaceFunction = (oldPhases: Phase[]) => Phase[];

interface PhasesMutation {
  newPhases?: PhaseConstructor[];
  replace: ReplaceFunction;
}

export class PhasesModule extends Module {
  constructor(private readonly mutation: PhasesMutation) {
    super();
  }

  installMixins(): void {
    if (this.mutation.newPhases != null) {
      this.installMixin(
        PhaseDelegator,
        phaseDelegatorMixin(this.mutation.newPhases),
      );
    }
    this.installMixin(PhaseEngine, phaseEngineMixin(this.mutation.replace));
  }
}

function phaseEngineMixin(replace: ReplaceFunction) {
  return function (
    Ctor: SimpleConstructor<PhaseEngine>,
  ): SimpleConstructor<PhaseEngine> {
    return class extends Ctor {
      phaseOrder(): Phase[] {
        return replace(super.phaseOrder());
      }
    };
  };
}

function phaseDelegatorMixin(newPhases: PhaseConstructor[]) {
  return function (
    Ctor: SimpleConstructor<PhaseDelegator>,
  ): SimpleConstructor<PhaseDelegator> {
    return class extends Ctor {
      constructor() {
        super();
        for (const ctor of newPhases) {
          this.install(ctor);
        }
      }
    };
  };
}
