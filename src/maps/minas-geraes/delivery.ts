import {MoveAction, MoveData} from "../../engine/move/move";
import {injectState} from "../../engine/framework/execution_context";
import {MiningExpertise} from "./mining";
import {Good} from "../../engine/state/good";
import {assert} from "../../utils/validate";
import {
    GOLDSMITH_VARIANT_BONUS_INCOME,
    GOLDSMITH_VARIANT_NO_MINING_EXPERTISE,
    GoldsmithVariant
} from "./action_selection";
import {Action} from "../../engine/state/action";
import {PlayerColor} from "../../engine/state/player";

export class MinasGeraesMoveAction extends MoveAction {
    private readonly miningExpertise = injectState(MiningExpertise);
    private readonly goldsmithVariant = injectState(GoldsmithVariant);

    validate(action: MoveData) {
        super.validate(action);

        if (action.good === Good.YELLOW) {
            if (this.currentPlayer().selectedAction !== Action.GOLDSMITH || this.goldsmithVariant() !== GOLDSMITH_VARIANT_NO_MINING_EXPERTISE) {
                const miningExpertise = this.miningExpertise().get(this.currentPlayer().color);
                assert(miningExpertise !== undefined && miningExpertise >= 1, {
                    invalidInput: "Cannot deliver gold without mining expertise"
                });
            }
        }
    }

    calculateIncome(action: MoveData): Map<PlayerColor | undefined, number> {
        const income = super.calculateIncome(action);
        if (action.good === Good.YELLOW) {
            const currentPlayer = this.currentPlayer();
            const currentPlayerColor = currentPlayer.color;
            income.set(currentPlayerColor, (income.get(currentPlayerColor) || 0) + 1);
            if (currentPlayer.selectedAction === Action.GOLDSMITH && this.goldsmithVariant() === GOLDSMITH_VARIANT_BONUS_INCOME) {
                income.set(currentPlayerColor, (income.get(currentPlayerColor) || 0) + 1);
            }
        }
        return income;
    }

    process(action: MoveData): boolean {
        const result = super.process(action);

        if (action.good === Good.BLACK) {
            const currentPlayer = this.currentPlayer().color;
            this.miningExpertise.update(state => {
                state.set(currentPlayer, (state.get(currentPlayer)||0)+1);
            })
        }
        if (action.good === Good.YELLOW) {
            if (this.currentPlayer().selectedAction !== Action.GOLDSMITH || this.goldsmithVariant() !== GOLDSMITH_VARIANT_NO_MINING_EXPERTISE) {
                const currentPlayer = this.currentPlayer().color;
                this.miningExpertise.update(state => {
                    state.set(currentPlayer, (state.get(currentPlayer) || 0) - 1);
                })
            }
        }

        return result;
    }
}