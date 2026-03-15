import {PlayerHelper} from "../../engine/game/player";
import {PlayerData} from "../../engine/state/player";
import {injectState} from "../../engine/framework/execution_context";
import {MiningExpertise} from "./mining";

export class MinasGeraesPlayerHelper extends PlayerHelper {
    private readonly miningExpertise = injectState(MiningExpertise);

    /** Returns the players ordered by their score. Tied players end up in the same placement in the array. */
    getPlayersOrderedByScore(): PlayerData[][] {
        const superPlayerPlacement = super.getPlayersOrderedByScore();
        const playerPlacement: PlayerData[][] = [];
        // FIXME: Break ties by mining expertise

        return playerPlacement;
    }
}