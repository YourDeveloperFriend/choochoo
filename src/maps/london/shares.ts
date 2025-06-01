import {ShareHelper} from "../../engine/shares/share_helper";

export class LondonShareHelper extends ShareHelper {
    getMaxShares(): number {
        return 20;
    }
}
