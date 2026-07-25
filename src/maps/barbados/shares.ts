import { ShareHelper } from "../../engine/shares/share_helper";

export class BarbadosShareHelper extends ShareHelper {
  getSharesTheyCanTake(): number {
    return Math.min(super.getSharesTheyCanTake(), 1);
  }
}
