import z from "zod";
import { assertNever } from "../../utils/validate";

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
}

export const PhaseZod = z.nativeEnum(Phase);

export function getPhaseString(phase: Phase): string {
  switch (phase) {
    case Phase.SHARES:
      return "Issue shares";
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
    default:
      assertNever(phase);
  }
}
