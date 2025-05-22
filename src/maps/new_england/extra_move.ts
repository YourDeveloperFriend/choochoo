import { MovePhase } from "../../engine/move/phase";

export class NewEnglandMovePhase extends MovePhase {
  numMoveRounds(): number {
    return 3;
  }
}
