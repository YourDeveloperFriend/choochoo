import {assert} from "../../utils/validate";
import {LocoAction} from "../../engine/move/loco";
import {injectInGamePlayers} from "../../engine/game/state";
import {PlayerData} from "../../engine/state/player";

export class DenmarkLocoAction extends LocoAction {
  protected readonly players = injectInGamePlayers();

  validate(): void {
    const player = this.currentPlayer();
    assert(!this.hasReachedLocoLimit(), {
      invalidInput: "can only loco once per round",
    });
    const nextLink = getNextAvailableLinkValue(this.currentPlayer(), this.players());
    assert(player.locomotive < nextLink, { invalidInput: `cannot loco more than ${nextLink}` });
  }

  process(): boolean {
    const nextLink = getNextAvailableLinkValue(this.currentPlayer(), this.players());
    const increasedBy = nextLink - this.currentPlayer().locomotive
    const incomeReduction = 2 * increasedBy;

    this.state.update((s) => s.locomotive.push(this.currentPlayer().color));
    this.playerHelper.updateCurrentPlayer((player) => {
      player.locomotive = nextLink;
      player.income -= incomeReduction;
    });
    this.log.currentPlayer(`locos to a new link value of ${nextLink}, reducing their income by ${incomeReduction}`);
    return true;
  }
}

export function getNextAvailableLinkValue(currentPlayer: PlayerData, players: PlayerData[]): number {
  const otherPlayers = players
      .filter(player => player.playerId !== currentPlayer.playerId);

  let maxLoco = 0;
  for (let player of otherPlayers) {
    maxLoco = Math.max(maxLoco, player.locomotive);
  }
  const haveAllOtherPlayersReachedIt = otherPlayers
      .some(player => player.locomotive !== maxLoco);
  if (haveAllOtherPlayersReachedIt) {
    return Math.max(maxLoco+1, 9);
  }
  return maxLoco;
}
