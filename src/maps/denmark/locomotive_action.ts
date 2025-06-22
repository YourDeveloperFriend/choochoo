import {MoveHelper} from "../../engine/move/helper";
import {injectState} from "../../engine/framework/execution_context";
import {PHASE} from "../../engine/game/phase";
import {PlayerData} from "../../engine/state/player";
import {Phase} from "../../engine/state/phase";
import {Action} from "../../engine/state/action";
import {injectCurrentPlayer, injectInGamePlayers} from "../../engine/game/state";
import {getNextAvailableLinkValue} from "./loco";

export class DenmarkMoveHelper extends MoveHelper {
    private readonly players = injectInGamePlayers();
    private readonly currentPlayer = injectCurrentPlayer();
    private readonly phase = injectState(PHASE);

    getLocomotiveDisplay(player: PlayerData): string {
        if (this.canUseLoco(player)) {
            const effectiveLink = this.getLocoLinkValue();
            const currentLink = this.currentPlayer().locomotive;
            return `${player.locomotive} (+${effectiveLink - currentLink})`;
        }
        return super.getLocomotiveDisplay(player);
    }

    getLocomotive(player: PlayerData): number {
        if (this.canUseLoco(player)) {
            return this.getLocoLinkValue();
        }
        return super.getLocomotive(player);
    }

    private canUseLoco(player: PlayerData): boolean {
        switch (this.phase()) {
            case Phase.MOVING:
            case Phase.ACTION_SELECTION:
            case Phase.BUILDING:
                return player.selectedAction === Action.LOCOMOTIVE;
            default:
                return false;
        }
    }

    private getLocoLinkValue() {
        return getNextAvailableLinkValue(this.currentPlayer(), this.players());
    }
}
