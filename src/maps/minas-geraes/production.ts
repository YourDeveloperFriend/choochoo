import {EmptyAction, EmptyActionProcessor} from "../../engine/game/action";
import {GoodsGrowthPhase} from "../../engine/goods_growth/phase";

export class MinasGeraesGoodsGrowthPhase extends GoodsGrowthPhase {

    configureActions() {
        super.configureActions();
        this.installAction(RedrawProductionAction);
    }

    onStart() {
        super.onStart();
        // FIXME: Return cubes from OP per the rules
    }
}

// FIXME: Allow redraw of yellows
export class RedrawProductionAction extends EmptyActionProcessor {
    static readonly action = "redraw-production-gold";

    canEmit() {
        return true;
    }

    validate() {
        super.validate();
    }

    process(): boolean {
        return false;
    }
}