import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { GridHelper } from "../map/grid_helper";
import { isLand, Land } from "../map/location";
import { SpaceType } from "../state/location_type";
import { PlayerColor, PlayerData } from "../state/player";
import { PlayerHelper } from "./player";
import {
  CURRENT_PLAYER,
  injectAllPlayersUnsafe,
  injectGrid,
  TURN_ORDER,
} from "./state";

export class MoneyManager {
  private readonly players = injectAllPlayersUnsafe();
  private readonly playerHelper = inject(PlayerHelper);
  private readonly currentPlayer = injectState(CURRENT_PLAYER);
  private readonly order = injectState(TURN_ORDER);
  private readonly gridHelper = inject(GridHelper);
  private readonly grid = injectGrid();

  addMoneyForCurrentPlayer(num: number): LostMoneyResponse {
    return this.addMoney(this.currentPlayer(), num);
  }

  addMoney(
    playerColor: PlayerColor,
    money: number,
    forced = false,
  ): LostMoneyResponse {
    const player = this.playerHelper.getPlayer(playerColor);
    const newMoney = player.money + money;
    const lostIncome = newMoney >= 0 ? 0 : -newMoney;
    if (newMoney >= 0) {
      this.playerHelper.update(
        playerColor,
        (player) => (player.money = newMoney),
      );
    } else {
      assert(forced === true);
      assert(
        lostIncome > 0,
        `you should never gain income through this code path, got ` +
          `lostIncome=$${lostIncome}, money=$${money}, playerMoney=$${player.money}`,
      );

      this.playerHelper.update(playerColor, (player) => {
        player.income -= lostIncome;
        player.money = 0;
      });
    }

    let newPlayerData = this.playerHelper.getPlayer(playerColor);
    if (this.isBankrupt(newPlayerData, forced)) {
      this.playerHelper.update(playerColor, (player) => {
        player.outOfGame = true;
      });
      newPlayerData = this.playerHelper.getPlayer(playerColor);
      this.outOfGame(newPlayerData);
    }
    return { lostIncome, outOfGame: newPlayerData.outOfGame ?? false };
  }

  protected isBankrupt(player: PlayerData, forced: boolean): boolean {
    if (player.income < 0) {
      assert(forced === true);
      return true;
    }
    return false;
  }

  protected outOfGame(player: PlayerData) {
    this.removeFromTurnOrder(player.color);
    this.removeOwnershipMarkers(player.color);
  }

  protected removeFromTurnOrder(player: PlayerColor): void {
    this.order.update((order) => {
      order.splice(order.indexOf(player), 1);
    });
  }

  protected removeOwnershipMarkers(player: PlayerColor): void {
    const toUpdate: Land[] = [...this.gridHelper.all()]
      .filter(isLand)
      .filter((location) =>
        [...location.getTrack()].some((track) => player === track.getOwner()),
      );
    for (const location of toUpdate) {
      this.gridHelper.update(location.coordinates, (space) => {
        assert(space.type !== SpaceType.CITY);
        assert(space.tile != null);
        space.tile.owners = space.tile.owners.map((owner) =>
          player === owner ? undefined : owner,
        );
      });
    }

    for (const connection of this.grid().connections) {
      if (connection.owner?.color === player) {
        this.gridHelper.setInterCityOwner(undefined, connection);
      }
    }
  }
}

interface LostMoneyResponse {
  lostIncome: number;
  outOfGame: boolean;
}
