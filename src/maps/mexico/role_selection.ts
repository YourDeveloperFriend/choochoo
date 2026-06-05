import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PhaseModule } from "../../engine/game/phase_module";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { PhaseEngine } from "../../engine/game/phase";
import {
  injectAllPlayersUnsafe,
  injectCurrentPlayer,
} from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { Random } from "../../engine/game/random";
import { Phase } from "../../engine/state/phase";
import { PlayerColor } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { MexicoRoleHelper } from "./roles";

const RoleChoice = z.enum(["state", "cartel", "random"]);

const PickRoleData = z.object({ role: RoleChoice });
type PickRoleData = z.infer<typeof PickRoleData>;

export class MexicoPickRoleAction implements ActionProcessor<PickRoleData> {
  static readonly action = "mexicoPickRole";
  readonly assertInput = PickRoleData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly allPlayers = injectAllPlayersUnsafe();
  private readonly roles = inject(MexicoRoleHelper);
  private readonly random = inject(Random);
  private readonly log = inject(Log);

  validate(_data: PickRoleData): void {}

  process({ role }: PickRoleData): boolean {
    const current = this.currentPlayer();
    const players = this.allPlayers();

    if (role === "state") {
      this.roles.initRoles(current.playerId);
      this.log.currentPlayer("chooses to play as the State");
    } else if (role === "cartel") {
      const other = players.find((p) => p.playerId !== current.playerId);
      assert(other != null, "other player not found");
      this.roles.initRoles(other.playerId);
      this.log.currentPlayer("chooses to play as the Cartel");
    } else {
      const statePlayer = players[this.random.random(2)];
      const cartelPlayer = players.find(
        (p) => p.playerId !== statePlayer.playerId,
      )!;
      this.roles.initRoles(statePlayer.playerId);
      this.log.player(statePlayer, "is randomly assigned the State role");
      this.log.player(cartelPlayer, "is randomly assigned the Cartel role");
    }
    return true;
  }
}

class MexicoRoleSelectionPhase extends PhaseModule {
  static readonly phase = Phase.ROLE_SELECTION;

  private readonly round = injectState(ROUND);
  private readonly random = inject(Random);

  configureActions(): void {
    this.installAction(MexicoPickRoleAction);
  }

  getPlayerOrder(): PlayerColor[] {
    return this.round() === 1 ? [this.turnOrder()[0]] : [];
  }

  onEnd(): void {
    if (this.round() === 1) {
      this.turnOrder.set(this.random.shuffle(this.turnOrder()));
    }
    super.onEnd();
  }
}

export class MexicoPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(MexicoRoleSelectionPhase);
  }
}

export class MexicoPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return [Phase.ROLE_SELECTION, ...super.phaseOrder()];
  }
}
