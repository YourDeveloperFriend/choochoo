import {MoneyManager} from "../../engine/game/money_manager";
import {PlayerData} from "../../engine/state/player";

export class DenmarkMoneyManager extends MoneyManager {
    protected isBankrupt(player: PlayerData): boolean {
        return player.income <= -10;
    }
}
