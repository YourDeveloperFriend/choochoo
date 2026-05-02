import { PlayerColor } from "../../engine/state/player";

interface Container {
  type: "user" | "game";
  id: number;
}

export interface PlayerColorContainer {
  type: "playerColor";
  colorName: string;
  playerColor: PlayerColor;
}

export type ParsedMessagePart = string | Container | PlayerColorContainer;

export function moveColorChipBeforeUser(
  parts: ParsedMessagePart[],
): ParsedMessagePart[] {
  const reordered: ParsedMessagePart[] = [];

  for (let index = 0; index < parts.length; index++) {
    const current = parts[index];
    if (typeof current === "string" || current.type !== "user") {
      reordered.push(current);
      continue;
    }

    const next = parts[index + 1];
    const nextNext = parts[index + 2];

    if (
      typeof next === "string" &&
      /^\s+$/.test(next) &&
      typeof nextNext !== "string" &&
      nextNext?.type === "playerColor"
    ) {
      reordered.push(nextNext, next, current);
      index += 2;
      continue;
    }

    if (typeof next !== "string" && next?.type === "playerColor") {
      reordered.push(next, " ", current);
      index += 1;
      continue;
    }

    reordered.push(current);
  }

  return reordered;
}
