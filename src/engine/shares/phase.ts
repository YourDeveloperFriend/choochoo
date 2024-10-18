import { PhaseModule } from "../game/phase";
import { Phase } from "../state/phase";
import { TakeSharesAction } from "./take_shares";

export class SharesPhase extends PhaseModule {
  static readonly phase = Phase.SHARES;

  configureActions() {
    this.installAction(TakeSharesAction);
  }
}