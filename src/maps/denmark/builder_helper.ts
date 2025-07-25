import { BuilderHelper } from "../../engine/build/helper";

export class DenmarkBuilderHelper extends BuilderHelper {
    protected ownershipMarkerLimit(): number {
        return Infinity;
    }
}
