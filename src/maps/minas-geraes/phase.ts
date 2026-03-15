import { SharesPhase } from "../../engine/shares/phase";
import { MiningToMoneyAction } from "./mining";
import { TurnOrderPhase } from "../../engine/turn_order/phase";
import { BuildPhase } from "../../engine/build/phase";
import { MovePhase } from "../../engine/move/phase";

// Override all phases to install the mining to money action. (Production and Action selection phases are elsewhere)

export class MinasGeraesSharesPhase extends SharesPhase {
  configureActions() {
    super.configureActions();
    this.installAction(MiningToMoneyAction);
  }
}

export class MinasGeraesTurnOrderPhase extends TurnOrderPhase {
  configureActions() {
    super.configureActions();
    this.installAction(MiningToMoneyAction);
  }
}

export class MinasGeraesBuildPhase extends BuildPhase {
  configureActions() {
    super.configureActions();
    this.installAction(MiningToMoneyAction);
  }
}

export class MinasGeraesMovePhase extends MovePhase {
  configureActions() {
    super.configureActions();
    this.installAction(MiningToMoneyAction);
  }
}
