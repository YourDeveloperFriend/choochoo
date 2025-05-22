import z from "zod";
import { assertNever } from "../../utils/validate";

export enum Action {
  LOCOMOTIVE = 0,
  FIRST_BUILD = 1,
  FIRST_MOVE = 2,
  ENGINEER = 3,
  TURN_ORDER_PASS = 4,
  URBANIZATION = 5,
  PRODUCTION = 6,

  // Montreal metro
  REPOPULATION = 7,

  // Ireland
  DEURBANIZATION = 8,

  // Sweden Recycling
  WTE_PLANT_OPERATOR = 9,

  // Madagascar
  LAST_BUILD = 10,
  LAST_MOVE = 11,
  SLOW_ENGINEER = 12,
  LAST_PLAYER = 13,
  HIGH_COSTS = 14,
  ONE_MOVE = 15,

  // Pittsburgh
  COMMONWEALTH = 17,

  // Moon
  LOW_GRAVITATION = 18,

  // Heavy Cardboard
  HEAVY_LIFTING = 19,

  // Sicily
  PROTECTION = 20,

  // Scandinavia
  FERRY = 21,
}

export const ActionZod = z.nativeEnum(Action);

export function getSelectedActionString(action?: Action) {
  switch (action) {
    case undefined:
      return "";
    case Action.LOCOMOTIVE:
      return "Locomotive";
    case Action.FIRST_BUILD:
      return "First Build";
    case Action.FIRST_MOVE:
      return "First Move";
    case Action.ENGINEER:
      return "Engineer";
    case Action.TURN_ORDER_PASS:
      return "Turn Order Pass";
    case Action.URBANIZATION:
      return "Urbanization";
    case Action.PRODUCTION:
      return "Production";
    case Action.REPOPULATION:
      return "Repopulation";
    case Action.DEURBANIZATION:
      return "Deurbanization";
    case Action.WTE_PLANT_OPERATOR:
      return "WTE Plant Operator";
    case Action.LAST_BUILD:
      return "Last Build";
    case Action.LAST_MOVE:
      return "Last Move";
    case Action.SLOW_ENGINEER:
      return "Slow Engineer";
    case Action.LAST_PLAYER:
      return "Last Player";
    case Action.HIGH_COSTS:
      return "High Costs";
    case Action.ONE_MOVE:
      return "One Move";
    case Action.COMMONWEALTH:
      return "Commonwealth";
    case Action.LOW_GRAVITATION:
      return "Low Gravitation";
    case Action.HEAVY_LIFTING:
      return "Heavy Lifting";
    case Action.PROTECTION:
      return "Protection";
    case Action.FERRY:
      return "Ferry";
    default:
      assertNever(action);
  }
}
