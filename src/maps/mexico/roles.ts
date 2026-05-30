import z from "zod";
import { injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { injectAllPlayersUnsafe } from "../../engine/game/state";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";

const MexicoRoleStateZod = z.object({
  statePlayerId: z.number(),
});

const MEXICO_ROLES = new Key("mexicoRoles", {
  parse: MexicoRoleStateZod.parse,
});

export class MexicoRoleHelper {
  private readonly roleState = injectState(MEXICO_ROLES);
  private readonly players = injectAllPlayersUnsafe();

  getStateColor(): PlayerColor {
    const { statePlayerId } = this.roleState();
    const player = this.players().find((p) => p.playerId === statePlayerId);
    assert(player != null, "state player not found");
    return player.color;
  }

  getCartelColor(): PlayerColor {
    const stateColor = this.getStateColor();
    const other = this.players().find((p) => p.color !== stateColor);
    assert(other != null, "cartel player not found");
    return other.color;
  }

  isState(color: PlayerColor): boolean {
    return color === this.getStateColor();
  }

  isCartel(color: PlayerColor): boolean {
    return color === this.getCartelColor();
  }

  isInitialized(): boolean {
    return this.roleState().statePlayerId !== -1;
  }

  initRoles(statePlayerId: number): void {
    this.roleState.set({ statePlayerId });
  }
}
