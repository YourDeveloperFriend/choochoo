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

export class ActionNamingProvider {
  getActionString(action?: Action): string {
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

  getActionDescription(action: Action): string {
    switch (action) {
      case Action.ENGINEER:
        return "Build an additional track during the Building step.";
      case Action.FIRST_BUILD:
        return "Go first during the Building step.";
      case Action.FIRST_MOVE:
        return "Go first during the Move Goods step.";
      case Action.LOCOMOTIVE:
        return "Immediately, increase your locomotive by one.";
      case Action.PRODUCTION:
        return "Before the Goods Growth step, draw two cubes and place them on the Goods Growth chart";
      case Action.TURN_ORDER_PASS:
        return "Next auction, pass without dropping out of the bidding.";
      case Action.URBANIZATION:
        return "Place a new city on any town during the build step.";
      case Action.REPOPULATION:
        return "Immediately, draw three cubes from the bag and place one on any station.";
      case Action.DEURBANIZATION:
        return "Before the Move Goods step, remove a goods cube of your choice from the map.";
      case Action.WTE_PLANT_OPERATOR:
        return "After the Move Goods step, take all black cubes from the WTE Plant space. Each cube is worth 2 points.";

      case Action.LAST_BUILD:
        return "Go last during the Building step.";
      case Action.LAST_MOVE:
        return "Go last during the Moving step.";
      case Action.SLOW_ENGINEER:
        return "Build one less track during the Building step.";
      case Action.LAST_PLAYER:
        return "Next auction, you must pass when it is your turn.";
      case Action.HIGH_COSTS:
        return "Each tile you build this turn costs an additional $4.";
      case Action.ONE_MOVE:
        return "Skip one of your move goods actions.";
      case Action.COMMONWEALTH:
        return "Reduces the cost of one $10 buid to $7.";
      case Action.LOW_GRAVITATION:
        return "Allows you to use other's links as if they are your own for both moves.";
      case Action.HEAVY_LIFTING:
        return "Allows you to move goods across open land. See rules for more information.";
      case Action.PROTECTION:
        return "Allows you to move black cubes from towns during the Move Goods step.";
      case Action.FERRY:
        return "Allows you to move one good across water. See rules for more information.";
      default:
        assertNever(action);
    }
  }
}
