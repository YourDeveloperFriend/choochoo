import z from "zod";
import { inject, injectState } from "../../engine/framework/execution_context";
import { Key } from "../../engine/framework/key";
import { ActionProcessor } from "../../engine/game/action";
import { Log } from "../../engine/game/log";
import { PhaseModule } from "../../engine/game/phase_module";
import { PhaseDelegator } from "../../engine/game/phase_delegator";
import { PhaseEngine } from "../../engine/game/phase";
import {
  injectAllPlayersUnsafe,
  injectCurrentPlayer,
  TURN_ORDER,
} from "../../engine/game/state";
import { ROUND } from "../../engine/game/round";
import { Random } from "../../engine/game/random";
import { Phase } from "../../engine/state/phase";
import { PlayerColor, PlayerColorZod } from "../../engine/state/player";
import { assert } from "../../utils/validate";
import { ALL_COUNTRIES, countryName } from "./roles";

const CyprusSelectionStateZod = z.object({
  assignments: z.array(
    z.object({
      playerId: z.number(),
      country: PlayerColorZod,
    }),
  ),
});

export const CYPRUS_SELECTION_STATE = new Key("cyprusRoleSelections", {
  parse: CyprusSelectionStateZod.parse,
});

const PickCountryData = z.object({
  country: z.union([PlayerColorZod, z.literal("randomize")]),
});
type PickCountryData = z.infer<typeof PickCountryData>;

export class CyprusPickCountryAction
  implements ActionProcessor<PickCountryData>
{
  static readonly action = "cyprusPickCountry";
  readonly assertInput = PickCountryData.parse;

  private readonly currentPlayer = injectCurrentPlayer();
  private readonly selectionState = injectState(CYPRUS_SELECTION_STATE);
  private readonly random = inject(Random);
  private readonly log = inject(Log);

  validate({ country }: PickCountryData): void {
    if (country === "randomize") return;
    const taken = this.selectionState().assignments.map((a) => a.country);
    assert(!taken.includes(country as PlayerColor), {
      invalidInput: "Country already chosen",
    });
  }

  process({ country }: PickCountryData): boolean {
    const current = this.currentPlayer();
    const taken = new Set(
      this.selectionState().assignments.map((a) => a.country),
    );
    const available = ALL_COUNTRIES.filter((c) => !taken.has(c));
    const assigned =
      country === "randomize"
        ? available[this.random.random(available.length)]
        : country;
    this.selectionState.update((state) => {
      state.assignments.push({ playerId: current.playerId, country: assigned });
    });
    if (country === "randomize") {
      this.log.currentPlayer(
        `is randomly assigned to play as ${countryName(assigned)}`,
      );
    } else if (available.length === 1) {
      this.log.currentPlayer(
        `is assigned to the last remaining country, ${countryName(assigned)}`,
      );
    } else {
      this.log.currentPlayer(`chooses to play as ${countryName(assigned)}`);
    }
    return true;
  }
}

class CyprusRoleSelectionPhase extends PhaseModule {
  static readonly phase = Phase.ROLE_SELECTION;

  private readonly round = injectState(ROUND);
  private readonly selectionState = injectState(CYPRUS_SELECTION_STATE);
  private readonly allPlayers = injectAllPlayersUnsafe();
  private readonly turnOrderState = injectState(TURN_ORDER);
  private readonly random = inject(Random);

  configureActions(): void {
    this.installAction(CyprusPickCountryAction);
  }

  onStart(): void {
    if (this.round() === 1) {
      this.selectionState.initState({ assignments: [] });
    }
  }

  getPlayerOrder(): PlayerColor[] {
    return this.round() === 1 ? this.turnOrder() : [];
  }

  forcedAction() {
    if (this.round() !== 1) return undefined;
    const taken = new Set(
      this.selectionState().assignments.map((a) => a.country),
    );
    const available = ALL_COUNTRIES.filter((c) => !taken.has(c));
    if (available.length === 1) {
      return {
        action: CyprusPickCountryAction,
        data: { country: available[0] },
      };
    }
    return undefined;
  }

  onEnd(): void {
    if (this.round() === 1) {
      const assignments = this.selectionState().assignments;
      const colorByPlayerId = new Map(
        assignments.map((a) => [a.playerId, a.country]),
      );

      // Capture original turn order as playerIds before colors change
      const orderedPlayerIds = this.turnOrder().map(
        (color) => this.allPlayers().find((p) => p.color === color)!.playerId,
      );

      // Apply all country assignments to player colors at once
      this.allPlayers.update((players) => {
        for (const player of players) {
          const newColor = colorByPlayerId.get(player.playerId);
          if (newColor != null) {
            player.color = newColor;
          }
        }
      });

      // Shuffle turn order after role selection is complete and player colors have been re-assigned
      this.turnOrderState.set(
        this.random.shuffle(
          orderedPlayerIds.map(
            (id) => this.allPlayers().find((p) => p.playerId === id)!.color,
          ),
        ),
      );

      this.selectionState.delete();
    }
    super.onEnd();
  }
}

export class CyprusPhaseDelegator extends PhaseDelegator {
  constructor() {
    super();
    this.install(CyprusRoleSelectionPhase);
  }
}

export class CyprusPhaseEngine extends PhaseEngine {
  phaseOrder(): Phase[] {
    return [Phase.ROLE_SELECTION, ...super.phaseOrder()];
  }
}
