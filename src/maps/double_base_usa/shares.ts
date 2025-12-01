import { ShareHelper } from "../../engine/shares/share_helper";

export class DoubleBaseUsaShareHelper extends ShareHelper {
  getMaxShares(): number {
    return 30;
  }
}
