import { SelectAction } from "../../engine/select_action/select";

export class DenmarkSelectAction extends SelectAction {
  // Loco provides a temporary increase of loco; see DenmarkMoveHelper
  protected applyLocomotive(): void {}
}
