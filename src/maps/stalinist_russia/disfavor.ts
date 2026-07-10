import { injectState } from "../../engine/framework/execution_context";
import { PlayerHelper, ScoreBreakdownKey } from "../../engine/game/player";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { TurnOrderHelper } from "../../engine/turn_order/helper";
import { DISFAVOR_TRACK, DISFAVOR_VALUES, MAX_DISFAVOR } from "./state";

export class StalinistRussiaTurnOrderHelper extends TurnOrderHelper {
  private readonly disfavorTrack = injectState(DISFAVOR_TRACK);

  pass(player: PlayerData): void {
    // The first player to pass becomes the last player in turn order and earns
    // Stalin's disfavor. nextTurnOrder is still empty at that point.
    const becomesLastPlayer = this.turnOrderState().nextTurnOrder.length === 0;
    super.pass(player);
    if (becomesLastPlayer) {
      this.disfavorTrack.update((track) => {
        const current = track.get(player.color) ?? 0;
        track.set(player.color, Math.min(current + 1, MAX_DISFAVOR));
      });
      this.log.player(player, "advances on Stalin's disfavor track");
    }
  }
}

export class StalinistRussiaPlayerHelper extends PlayerHelper {
  private readonly disfavorTrack = injectState(DISFAVOR_TRACK);

  getScoreBreakdown(player: PlayerData): Map<ScoreBreakdownKey, number> {
    const breakdown = super.getScoreBreakdown(player);
    breakdown.set("Disfavor", this.getScoreFromDisfavor(player));
    return breakdown;
  }

  getScoreFromDisfavor(player: PlayerData): number {
    if (player.outOfGame) return 0;
    return DISFAVOR_VALUES[this.disfavorPosition(player.color)];
  }

  disfavorPosition(color: PlayerColor): number {
    return this.disfavorTrack().get(color) ?? 0;
  }
}
