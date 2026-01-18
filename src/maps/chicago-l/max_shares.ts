import { ShareHelper } from "../../engine/shares/share_helper";

export class ChicagoLShareHelper extends ShareHelper {
  getMaxShares(): number {
    return 20;
  }
}
