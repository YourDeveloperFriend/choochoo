import { MapKey } from "../../engine/framework/key";
import { PlayerColorZod } from "../../engine/state/player";
import z from "zod";
import { EmptyActionProcessor } from "../../engine/game/action";
import { inject, injectState } from "../../engine/framework/execution_context";
import { assert } from "../../utils/validate";
import { injectCurrentPlayer } from "../../engine/game/state";
import { PlayerHelper } from "../../engine/game/player";

export const MiningExpertise = new MapKey(
  "MiningExpertise",
  PlayerColorZod.parse,
  z.number().parse,
);

export class MiningToMoneyAction extends EmptyActionProcessor {
  static readonly action = "mineas-geraes-mining-to-money";
  private readonly miningExpertise = injectState(MiningExpertise);
  private readonly currentPlayer = injectCurrentPlayer();
  private readonly playerHelper = inject(PlayerHelper);

  validate(): void {
    super.validate();
    const miningExpertise = this.miningExpertise().get(
      this.currentPlayer().color,
    );
    assert(miningExpertise !== undefined && miningExpertise >= 1, {
      invalidInput:
        "Cannot exchange mining expertise for money when mining expertise is 0.",
    });
  }

  process(): boolean {
    const currentPlayer = this.currentPlayer().color;
    this.miningExpertise.update((state) => {
      state.set(currentPlayer, (state.get(currentPlayer) || 0) - 1);
    });
    this.playerHelper.updateCurrentPlayer((player) => {
      player.money += 1;
    });
    return false;
  }
}
