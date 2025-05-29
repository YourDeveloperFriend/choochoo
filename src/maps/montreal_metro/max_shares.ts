import { ShareHelper } from "../../engine/shares/share_helper";

export class MontrealMetroShareHelper extends ShareHelper {
  getMaxShares(): number {
    return 20;
  }
}
