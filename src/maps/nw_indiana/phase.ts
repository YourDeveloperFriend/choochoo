import { BuildPhase } from "../../engine/build/phase";
import { MovePhase } from "../../engine/move/phase";
import { SelectActionPhase } from "../../engine/select_action/phase";
import { TurnOrderPhase } from "../../engine/turn_order/phase";
import { NwIndianaIssueShareForMoneyAction } from "./shares";

export class NwIndianaTurnOrderPhase extends TurnOrderPhase {
  configureActions() {
    super.configureActions();
    this.installAction(NwIndianaIssueShareForMoneyAction);
  }
}

export class NwIndianaSelectActionPhase extends SelectActionPhase {
  configureActions() {
    super.configureActions();
    this.installAction(NwIndianaIssueShareForMoneyAction);
  }
}

export class NwIndianaBuildPhase extends BuildPhase {
  configureActions() {
    super.configureActions();
    this.installAction(NwIndianaIssueShareForMoneyAction);
  }
}

export class NwIndianaMovePhase extends MovePhase {
  configureActions() {
    super.configureActions();
    this.installAction(NwIndianaIssueShareForMoneyAction);
  }
}
