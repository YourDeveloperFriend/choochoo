import { assert } from "../../utils/validate";
import { LocoAction } from "../../engine/move/loco";
import { injectInGamePlayers } from "../../engine/game/state";
import { PlayerData } from "../../engine/state/player";

export class DenmarkLocoAction extends LocoAction {
  protected readonly players = injectInGamePlayers();

  validate(): void {
    const player = this.currentPlayer();
    assert(!this.hasReachedLocoLimit(), {
      invalidInput: "can only loco once per round",
    });
    const nextLink = getNextAvailableLinkValue(
      this.currentPlayer(),
      this.players(),
    );
    assert(player.locomotive < nextLink, {
      invalidInput: `cannot loco more than ${nextLink}`,
    });
  }

  process(): boolean {
    const nextLink = getNextAvailableLinkValue(
      this.currentPlayer(),
      this.players(),
    );
    const increasedBy = nextLink - this.currentPlayer().locomotive;
    const incomeReduction = 2 * increasedBy;

    this.state.update((s) => s.locomotive.push(this.currentPlayer().color));
    this.playerHelper.updateCurrentPlayer((player) => {
      player.locomotive = nextLink;
      player.income -= incomeReduction;
    });
    this.log.currentPlayer(
      `locos to a new link value of ${nextLink}, reducing their income by ${incomeReduction}`,
    );
    return true;
  }
}

export function getNextAvailableLinkValue(
  currentPlayer: PlayerData,
  players: PlayerData[],
): number {
  const otherPlayers = players.filter(
    (player) => player.playerId !== currentPlayer.playerId,
  );

  // Find the smallest value which all other players have met or exceeded
  const minOtherPlayerLoco = Math.min.apply(
    null,
    otherPlayers.map((player) => player.locomotive),
  );
  // The next available loco is the smallest number that all other players have not met or exceeded (to a limit of 9)
  const nextAvailableLoco = Math.min(minOtherPlayerLoco + 1, 9);
  // If the next available is greater than the player's current loco, that's what they can increase to
  if (nextAvailableLoco > currentPlayer.locomotive) {
    return nextAvailableLoco;
  }
  // Otherwise they can increase by one (to a max of 9)
  return Math.min(currentPlayer.locomotive + 1, 9);
}
