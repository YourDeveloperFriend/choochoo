import { z } from "zod";
import { Immutable } from "../../utils/immutable";
import { assertNever } from "../../utils/validate";
import { ActionZod } from "./action";

export enum PlayerColor {
  RED = 1,
  YELLOW,
  GREEN,
  PURPLE,
  BLACK,
  BLUE,
  BROWN,
  WHITE,
}

export const PlayerColorZod = z.nativeEnum(PlayerColor);

export function stringToPlayerColor(str: string): PlayerColor {
  return PlayerColorZod.parse(Number(str));
}

export const MutablePlayerData = z.object({
  playerId: z.number(),
  color: z.nativeEnum(PlayerColor),
  income: z.number(),
  shares: z.number(),
  money: z.number(),
  locomotive: z.number(),
  selectedAction: ActionZod.optional(),
  outOfGame: z.boolean().optional(),
});

export type MutablePlayerData = z.infer<typeof MutablePlayerData>;
export type PlayerData = Immutable<MutablePlayerData>;

export function playerColorToString(
  playerColor?: PlayerColor,
):
  | "red"
  | "yellow"
  | "green"
  | "purple"
  | "black"
  | "blue"
  | "brown"
  | "white"
  | "grey" {
  switch (playerColor) {
    case PlayerColor.RED:
      return "red";
    case PlayerColor.YELLOW:
      return "yellow";
    case PlayerColor.GREEN:
      return "green";
    case PlayerColor.PURPLE:
      return "purple";
    case PlayerColor.BLACK:
      return "black";
    case PlayerColor.BLUE:
      return "blue";
    case PlayerColor.BROWN:
      return "brown";
    case PlayerColor.WHITE:
      return "white";
    case undefined:
      return "grey";
    default:
      assertNever(playerColor);
  }
}

export const eligiblePlayerColors = [
  PlayerColor.RED,
  PlayerColor.YELLOW,
  PlayerColor.GREEN,
  PlayerColor.PURPLE,
  PlayerColor.BLACK,
  PlayerColor.BLUE,
  PlayerColor.BROWN,
];

export const allPlayerColors = [...eligiblePlayerColors, PlayerColor.WHITE];
