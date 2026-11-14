import { injectState } from "../../engine/framework/execution_context";
import { MoneyManager } from "../../engine/game/money_manager";
import { PlayerColor } from "../../engine/state/player";
import { LOCO_TRACK } from "./state";

export class StalinistRussiaMoneyManager extends MoneyManager {
  private readonly locoTrack = injectState(LOCO_TRACK);

  // The disk on the locomotive track is an ownership marker. Removing it also
  // frees up their single-player position.
  protected removeOwnershipMarkers(player: PlayerColor): void {
    super.removeOwnershipMarkers(player);
    this.locoTrack.update((track) => {
      track.delete(player);
    });
  }
}
