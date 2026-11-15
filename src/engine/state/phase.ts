import z from "zod";
import { assertNever, fail } from "../../utils/validate";

export enum Phase {
  SHARES = 1,
  TURN_ORDER = 2,
  ACTION_SELECTION = 3,
  BUILDING = 4,
  MOVING = 5,
  INCOME = 6,
  EXPENSES = 7,
  INCOME_REDUCTION = 8,
  GOODS_GROWTH = 9,
  END_GAME = 10,

  // Ireland
  DEURBANIZATION = 11,

  // India (Steam Brothers)
  MANUAL_GOODS_GROWTH = 12,

  // Disco Inferno
  DISCO_INFERNO_PRODUCTION = 13,

  // Soul Train
  EARTH_TO_HEAVEN = 14,

  // St Lucia
  ST_LUCIA_TURN_ORDER = 15,

  // Montreal Metro
  GOVERNMENT_BUILD = 16,

  // Mexico, Cyprus
  ROLE_SELECTION = 17,

  // Stalinist Russia, Isle of Wight
  STALINIST_LOCOMOTIVE = 18,

  /**
   * Placeholders for map-specific phases. A map that needs a new phase aliases one of
   * these (e.g. `const FERRY = Phase.MAP_CUSTOM_PHASE_1`) and must supply the name through
   * its own PhaseNamingProvider override; the common provider throws for these. Different
   * maps may reuse the same value, since a game only has one map.
   */
  MAP_CUSTOM_PHASE_1 = 20,
  MAP_CUSTOM_PHASE_2 = 21,
  MAP_CUSTOM_PHASE_3 = 22,
  MAP_CUSTOM_PHASE_4 = 23,
}

export const PhaseZod = z.nativeEnum(Phase);

/**
 * The display name of a phase, injectable so that a map can rename one.
 *
 * Two maps can share a phase enum value while calling it different things --
 * Isle of Wight reuses STALINIST_LOCOMOTIVE for its Buy Trains step -- so the
 * name has to be resolved through the injection context rather than read
 * straight off the enum.
 */
export class PhaseNamingProvider {
  getPhaseString(phase: Phase): string {
    return getPhaseString(phase);
  }
}

function getPhaseString(phase: Phase): string {
  switch (phase) {
    case Phase.SHARES:
      return "Issue shares";
    case Phase.ST_LUCIA_TURN_ORDER:
    case Phase.TURN_ORDER:
      return "Bid for turn order";
    case Phase.ACTION_SELECTION:
      return "Select actions";
    case Phase.BUILDING:
      return "Build track";
    case Phase.MOVING:
      return "Move goods";
    case Phase.INCOME:
      return "Collect income";
    case Phase.EXPENSES:
      return "Pay expenses";
    case Phase.INCOME_REDUCTION:
      return "Income reduction";
    case Phase.MANUAL_GOODS_GROWTH:
    case Phase.GOODS_GROWTH:
      return "Goods growth";
    case Phase.END_GAME:
      return "End Game";
    case Phase.DEURBANIZATION:
      return "Deurbanization";
    case Phase.DISCO_INFERNO_PRODUCTION:
      return "Production";
    case Phase.EARTH_TO_HEAVEN:
      return "Earth to Heaven";
    case Phase.GOVERNMENT_BUILD:
      return "Government build";
    case Phase.ROLE_SELECTION:
      return "Role selection";
    case Phase.STALINIST_LOCOMOTIVE:
      return "Locomotive";
    case Phase.MAP_CUSTOM_PHASE_1:
    case Phase.MAP_CUSTOM_PHASE_2:
    case Phase.MAP_CUSTOM_PHASE_3:
    case Phase.MAP_CUSTOM_PHASE_4:
      return fail(`map must provide a name for custom phase ${Phase[phase]}`);
    default:
      assertNever(phase);
  }
}
